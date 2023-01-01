#!/bin/bash

yagna payment release-allocations
yagna payment init --sender --network=$1 --driver=erc20 > /dev/null 2>&1

YAGNA_APPKEY=$(yagna app-key list --json | jq '.[].key' | tr -d '"')
if [ "$YAGNA_APPKEY" == "" ]; then
	YAGNA_APPKEY=$(yagna app-key create requestor) > /dev/null 2>&1
fi

echo $YAGNA_APPKEY