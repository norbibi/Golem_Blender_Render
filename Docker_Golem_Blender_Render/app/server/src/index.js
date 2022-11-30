const WebSocketServer = require('ws');
const fs = require("fs");
const { execSync, spawn } = require("child_process");
const path = require("path");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(fileUpload());
app.use(cors());

app.post("/upload", function (req, res) {
	let timeout = req.query.long ? 10000 : 1000;
	setTimeout(() => {
    	res.status(201).json({ success: true });
  	}, timeout);
  	fs.writeFile(__dirname + '/../inputs/' + req.files.file.name, req.files.file.data, function(err) {
    	if(err)
    		return console.log(err);
	});
});

app.listen(port);

const wss = new WebSocketServer.Server({ port: 8000 })

wss.on('connection', ws => {
    ws.on('message', message => {
    	var msg = JSON.parse(message);
		switch(msg.command) {

			case 'startApp':
				startPythonApp(msg, ws);
				break;

			case 'analyseScene':
				var cmd = spawn('/usr/bin/blender', ['-b', 'inputs/scene.blend', '--python', 'src/get_blender_infos.py']);
				cmd.stdout.on('data', (data) => {
					sendWSMessage(ws, {
						command: 'analyseScene',
						data: data.toString()
					});
				});
				break;

			case 'rearmTimeout':
				clearTimeout(ws.timeout);
				ws.timeout = setTimeout(sendSigintToApp, 10000, ws.timeout_pid);

			default:
		}
    });

    ws.on("error", error => {
        console.log(error);
    });
});

function sendWSMessage(ws, message){
	ws.send(JSON.stringify(message));
}

function sendSigintToApp(pid){
  	spawn('kill', ['-s', '2', pid]);
}

function startPythonApp(msg, ws){
	var appk_key = execSync(`./start_yagna.sh ${msg.network}`).toString().replace('\n', '');
  	var cmd = spawn('python3', ['./src/cuda_blender.py',
  															'--payment-driver', msg.driver,
  															'--payment-network', msg.network,
  															'--subnet-tag', msg.subnet,
  															'--timeout-upload', msg.timeoutUpload,
  															'--timeout-render', msg.timeoutRender,
  															'--timeout-global', msg.timeoutGlobal,
  															'--workers', msg.workers,
  															'--memory', msg.memory,
  															'--storage', msg.storage,
  															'--threads', msg.threads,
  															'--gpu', msg.gpu,
  															'--budget', msg.budget,
      														'--interval-payment', msg.iPayment,
      														'--start-price', msg.startPrice,
      														'--cpu-price', msg.cpuPrice,
      														'--env-price', msg.envPrice,
  															'--scene', msg.scene,
  															'--start-frame', msg.startFrame.toString(),
  															'--end-frame', msg.endFrame.toString(),
  															'--use-bad-providers', msg.useBadProviders.toString(),
  															'--register-bad-providers-activity-create-failed', msg.registerBadProvidersActivityCreateFailed.toString(),
														    '--register-bad-providers-task-rejected', msg.registerBadProvidersTaskRejected.toString(),
														    '--register-bad-providers-worker-finished', msg.registerBadProvidersWorkerFinished.toString(),
														    '--register-bad-providers-batch-timeout', msg.registerBadProvidersBatchTimeout.toString()
  	], { env: {...process.env, 'YAGNA_APPKEY': appk_key}});

  	ws.timeout_pid = cmd.pid;
  	ws.timeout = setTimeout(sendSigintToApp, 10000, ws.timeout_pid);

	cmd.stdout.on('data', (data) => {
		console.log('stdout');
		var sdata = data.toString().replace('\n','').trim();
		console.log(sdata);

		if (sdata == 'ShutdownFinished')
		{
			clearTimeout(ws.timeout);
			sendWSMessage(ws, {
				command: 'App',
				finished: true
			});
		}
		else if (sdata == 'Count')
		{
			sendWSMessage(ws, {
				command: 'App',
				count: true
			});
		}
		else
			sendWSMessage(ws, {
				command: 'App',
				result: sdata
			});
	});

	cmd.stderr.on('data', (data) => {
		console.log('stderr');
		var sdata = data.toString().replace('\n','').trim();
		console.log(sdata);
	});
}
