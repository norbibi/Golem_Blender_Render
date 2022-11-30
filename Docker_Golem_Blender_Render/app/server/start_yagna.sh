#!/bin/bash

if [ $1 == "rinkeby" ]; then
	res_payment=""
	while [[ $res_payment != *"Received funds"* ]]; do
		res_payment=$(yagna payment fund 2>/dev/null)
	done
fi

yagna payment init --sender --network=$1 --driver=erc20 > /dev/null 2>&1

YAGNA_APPKEY=$(yagna app-key list --json | jq '.values[0][1]' | tr -d '"')
if [ $YAGNA_APPKEY == "null" ]; then
	YAGNA_APPKEY=$(yagna app-key create requestor) > /dev/null 2>&1
fi

echo $YAGNA_APPKEY