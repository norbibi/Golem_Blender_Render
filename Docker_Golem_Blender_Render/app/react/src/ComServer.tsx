import { w3cwebsocket as W3CWebSocket } from "websocket";
import createUploader, { UPLOADER_EVENTS } from "@rpldy/uploader";

export class WsClient {
	client: any;
	listeners: any;
	cbdata: any;

	constructor(url: string) {
    	this.client = new W3CWebSocket(url);

		this.client.onopen = function () {
			console.log('WebSocket Client Connected');
		};

		this.client.onerror = function (error: any) {
			console.log('WebSocket Error ' + error);
		};

		this.client.onmessage = (message: any) => {
			var msg = JSON.parse(message.data as string);
			this.listeners[msg.command](msg, this.cbdata);
		};
	}

	SendMessage(message: any) {
		this.client.send(JSON.stringify(message));
	}

	SetListener(Listeners: any) {
		this.listeners = Listeners;
	}

	SetCbdata(Cbdata: any) {
		this.cbdata = Cbdata;
	}

}

export class Upload {
	uploader: any;
	cb: any = null;

	constructor(url: string) {
    	this.uploader = createUploader({
    		destination: {url: url}
		});
	}

	SetCb(cb: any) {
		if (this.cb == null)
			this.cb = this.uploader.on(UPLOADER_EVENTS.ITEM_FINISH, cb);
	}

	AddFile(file: any) {
		this.uploader.add(file);
	}
}