const chalk = require('chalk')
const tls = require('tls')
var fs = require('fs')
var path = require('path');
const prompt = require('./utils/prompt')

var options = {
    key: fs.readFileSync('server-cert/private-key.pem'),
    cert: fs.readFileSync('server-cert/public-cert.pem')
}

let clients = {}

var server = tls.createServer(options, (client) => {
    
    client.connID = client.remoteAddress.replace(/^.*:/, '') + '-' + Math.floor(Math.random() * 100000)
    console.log(chalk.green(client.connID))

    clients[client.connID] = client
    client.write(chalk.green(`1Connected! Your id is ${client.connID}\r\n`))

    client.on('data', (data) => {
        console.log(`From Client (${client.connID}):\n ${data.toString()}`)
    })

    client.on('close', () => {
        console.log(chalk.red(`Client has disconnected ${client.connID}`))
        delete clients[client.connID]
    })

    client.on('error', (error) => {
        console.log(chalk.red(`Error has occured on ${client.connID}\n${error}`))
        delete clients[client.connID]
    })
})

server.listen(2222, () => {
    console.log('Server is listening')

    prompt(clients)
})