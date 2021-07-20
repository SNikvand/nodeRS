const tls = require('tls')
const fs = require('fs')
const chalk = require('chalk')

const fsClients = {}

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 * Note: the same key may end up being used for https web portal as well.
 */
 const options = {
    key: fs.readFileSync('server-cert/private-key.pem'),
    cert: fs.readFileSync('server-cert/public-cert.pem')
}


var fsServer = tls.createServer(options, (client) => {
    
    // Dump data from any client to console along with their ID
    client.on('data', (data) => {
        msg = data.toString()

        console.log('fsclient ' + msg.substr(3))
        if (msg.substr(0,3) == '_+4') {
            connID = msg.substr(3)
            fsClients[connID] = client
            client.connID = connID
        }

    })

    // When client disconnects, remove it from the "clients" object
    client.on('close', () => {
        console.log(chalk.red(`FS Client has disconnected ${client.connID}`))
        delete fsClients[client.connID]
    })

    // when client throws error, remove it from the "clients" object
    client.on('error', (error) => {
        console.log(chalk.red(`Error has occured on FS ${client.connID}\n${error}`))
        delete fsClients[client.connID]
    })
})

module.exports = {
    fsServer,
    fsClients
}