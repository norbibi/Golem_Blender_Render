import asyncio
import argparse
from datetime import datetime, timedelta
import pathlib
import sys
import os
import signal
import math
from decimal import Decimal
from yapapi.props import inf, com

from yapapi import (
    Golem,
    Task,
    WorkContext,
)
from yapapi.payload import vm
from yapapi.rest.activity import BatchTimeoutError
from yapapi.events import (
    ProposalRejected,
    AgreementConfirmed,
    TaskAccepted,
    DebitNoteAccepted,
    InvoiceAccepted,
    ShutdownFinished
)

from yapapi import events

from yapapi.contrib.strategy import ProviderFilter

from yapapi.strategy import (
    LeastExpensiveLinearPayuMS,
    PROP_DEBIT_NOTE_INTERVAL_SEC,
    PROP_PAYMENT_TIMEOUT_SEC,
    PropValueRange
)

from yapapi.log import enable_default_logger

current_dir = pathlib.Path(__file__).resolve().cwd()

frames = []
bad_providers = set()

class ShortDebitNoteIntervalAndPaymentTimeout(LeastExpensiveLinearPayuMS):
    def __init__(self, expected_time_secs, max_fixed_price, max_price_for, interval_payment):
        super().__init__(expected_time_secs, max_fixed_price, max_price_for)
        if interval_payment != 0:
            self.interval_payment = interval_payment
            self.acceptable_prop_value_range_overrides = {
                PROP_DEBIT_NOTE_INTERVAL_SEC: PropValueRange(self.interval_payment, math.floor((self.interval_payment*6)/5)),
                PROP_PAYMENT_TIMEOUT_SEC: PropValueRange(60, 70),
            }

async def main( payment_driver,
                payment_network,
                subnet_tag,
                budget,
                interval_payment,
                start_price,
                cpu_price,
                env_price,
                timeout_global,
                timeout_upload,
                timeout_render,
                workers,
                memory,
                storage,
                threads,
                gpu,
                scene,
                frames,
                output_dir):

    if gpu == "None":
        capabilities=[]
    else:
        capabilities=[f"cuda, {gpu}"]

    package = await vm.repo(
		image_hash="38badf173192ef6731dddde88586d54af5cc5d825e6676271b5198b9",
        min_mem_gib=memory,
        min_storage_gib=storage,
        min_cpu_threads=threads,
        capabilities=capabilities,
    )

    def event_consumer(event: events.Event):
        if isinstance(event, events.ActivityCreateFailed):
            bad_providers.add(event.provider_id)
        elif isinstance(event, events.TaskRejected):
            bad_providers.add(event.provider_id)
        elif isinstance(event, events.WorkerFinished):
            bad_providers.add(event.provider_id)

        if isinstance(event, events.TaskAccepted):
            print('Task data ' + str(event.task.data) + ' accepted from provider ' + event.agreement.details.provider_node_info.name)
            sys.stdout.flush()

    async def worker(ctx: WorkContext, tasks):

        input_file = str(current_dir) + "/inputs/archive.zip"
        script = ctx.new_script(timeout=timedelta(minutes=(timeout_upload + timeout_render)))
        script.upload_file(input_file, "/golem/resources/archive.zip");

        try:
            script.run("/bin/sh", "-c", "(rm -rf /golem/output/*) || true")
            script.run("/bin/sh", "-c", "unzip -o /golem/resources/archive.zip -d /golem/resources/")

            if gpu == "None":
                cmd_display = "((Xorg :1 &) || true) && sleep 5"
            else:
                cmd_display = "PCIID=$(nvidia-xconfig --query-gpu-info | grep 'PCI BusID' | awk -F'PCI BusID : ' '{print $2}') && (nvidia-xconfig --busid=$PCIID --use-display-device=none --virtual=1280x1024 || true) && ((Xorg :1 &) || true) && sleep 5"
            script.run("/bin/sh", "-c", cmd_display)

            async for task in tasks:

                frame = task.data

                if gpu == "None":
                    cmd_render = "(DISPLAY=:1 blender -b /golem/resources/" + scene + " --python /usr/src/disable_compositing.py -o /golem/output/ -noaudio -F PNG -f " + str(frame) + " -- --cycles-device CPU) || true"
                else:
                    cmd_render = "(DISPLAY=:1 blender -b /golem/resources/" + scene + " -o /golem/output/ -noaudio -F PNG -f " + str(frame) + " -- --cycles-device CUDA) || true"

                script.run("/bin/sh", "-c", cmd_render)
                output_file = f"{output_dir}/{frame:04d}.png"
                future_result = script.download_file(f"/golem/output/{frame:04d}.png", output_file)

                yield script
                result = await future_result

                if result.success:
                    task.accept_result(result=f"{frame:04d}")
                else:
                    task.reject_result(reason="bad result", retry=True)

                script = ctx.new_script(timeout=timedelta(minutes=timeout_render))

        except BatchTimeoutError:
            bad_providers.add(ctx.provider_id)
            raise

    golem = Golem(
        budget=budget,
        subnet_tag=subnet_tag,
        payment_driver=payment_driver,
        payment_network=payment_network,
    )

    golem.strategy = ProviderFilter(ShortDebitNoteIntervalAndPaymentTimeout(
        expected_time_secs=3600,
        max_fixed_price=Decimal(str(start_price)),
        max_price_for={
            com.Counter.CPU: Decimal(str(cpu_price)),
            com.Counter.TIME: Decimal(str(env_price))
        },
        interval_payment=interval_payment
    ), lambda provider_id: provider_id not in bad_providers)

    async with golem:
        golem.add_event_consumer(event_consumer)

        completed_tasks = golem.execute_tasks(
            worker,
            [Task(data=frame) for frame in frames],
            payload=package,
            max_workers=workers,
            timeout=timedelta(hours=timeout_global)
        )

        async for task in completed_tasks:
            frames.remove(int(task.result))
            print('Count')
            sys.stdout.flush()


def signal_handler(sig, frame):
    print('timeout_signal')
    sys.stdout.flush()
    sys.exit(0)

if __name__ == "__main__":

    signal.signal(signal.SIGINT, signal_handler)
    parser = argparse.ArgumentParser()
    parser.add_argument("--payment-driver", type=str)
    parser.add_argument("--payment-network", type=str)
    parser.add_argument("--subnet-tag", type=str)
    parser.add_argument("--budget", type=float)
    parser.add_argument("--timeout-global", type=int)
    parser.add_argument("--timeout-upload", type=int)
    parser.add_argument("--timeout-render", type=int)
    parser.add_argument("--workers", type=int)
    parser.add_argument("--memory", type=int)
    parser.add_argument("--storage", type=int)
    parser.add_argument("--threads", type=int)
    parser.add_argument("--gpu", type=str)
    parser.add_argument("--scene", type=str)
    parser.add_argument("--start-frame", type=int)
    parser.add_argument("--end-frame", type=int)
    parser.add_argument("--interval-payment", type=int)
    parser.add_argument("--start-price", type=int)
    parser.add_argument("--cpu-price", type=int)
    parser.add_argument("--env-price", type=int)

    args = parser.parse_args()

    project_name = args.scene.split('/')[0] + '_' + datetime.now().strftime("%d-%m-%Y_%H-%M-%S")
    output_dir = str(current_dir) + '/outputs/' + project_name
    os.mkdir(output_dir)

    enable_default_logger(
        log_file=output_dir + '/' + project_name + '.log',
        debug_activity_api=True,
        debug_market_api=True,
        debug_payment_api=True,
        debug_net_api=True,
    )

    frames = list(range(args.start_frame, args.end_frame+1, 1))

    loop = asyncio.get_event_loop()
    task = loop.create_task(main(
            payment_driver=args.payment_driver,
            payment_network=args.payment_network,
            subnet_tag=args.subnet_tag,
            budget=args.budget,
            interval_payment=args.interval_payment,
            start_price=(args.start_price/3600000),
            cpu_price=(args.cpu_price/3600000),
            env_price=(args.env_price/3600000),
            timeout_global=args.timeout_global,
            timeout_upload=args.timeout_upload,
            timeout_render=args.timeout_render,
            workers=args.workers,
            memory=args.memory,
            storage=args.storage,
            threads=args.threads,
            gpu=args.gpu,
            scene=args.scene,
            frames=frames,
            output_dir=output_dir
        ))
    loop.run_until_complete(task)

    print('ShutdownFinished')
    sys.stdout.flush()
