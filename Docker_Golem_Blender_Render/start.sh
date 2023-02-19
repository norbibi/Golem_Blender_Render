#!/bin/sh

node ./app/server/src/export-key-as-json.js $PK ''

killall yagna > /dev/null 2>&1 &
sleep 5
rm -rf ~/.local/share/yagna > /dev/null 2>&1 &
yagna service run > /dev/null 2>&1 &
sleep 5
yagna id create --from-keystore key.json
ADDR=0x$(jq '.address' key.json | tr -d '"')
echo REACT_APP_ADDR=$ADDR > app/react/.env
yagna id update --set-default $ADDR
killall yagna
sleep 5
yagna service run > /dev/null 2>&1 &

cd /home/golem/app/server && yarn start &
cd /home/golem/app/react && yarn start