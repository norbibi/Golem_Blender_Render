const fs = require("fs")
const wallet = require("ethereumjs-wallet").default

const pk = new Buffer.from(process.argv[2], 'hex')
const account = wallet.fromPrivateKey(pk)
const password = process.argv[3]

account.toV3(password)
    .then(value => {
        const address = account.getAddress().toString('hex')
        const file = `key.json`
        fs.writeFileSync(file, JSON.stringify(value))
    });
