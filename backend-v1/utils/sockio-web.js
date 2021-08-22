const http = require('http')
const path = require('path')

const express = require('express')
const socketio = require('socket.io')
const hbs = require('hbs')

const { server, clients, ioclients } = require('./tls-com-sock')
const nodersRouter = require('./routes')

// Static paths for views & Partials
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Express app
const app = express()
const httpServer = http.createServer(app)
const io = socketio(httpServer)

// Setup HBS and paths for HBS
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup express public static path
app.use(express.static(publicDirectoryPath))
app.use(nodersRouter)

/**
 * Socket IO (WEB SERVER)
 */
io.on('connection', (socket) => {
    console.log('new socketio connection')

    // recieve from ioclient the tls key and add to ioclients stack
    socket.on('bind', (tlsSockId) => {
        ioclients[tlsSockId] = socket
    })

    // Reset listener incase the shell child process on the clientV2 needs to be killed and restarted
    socket.on('rst', (tlsSockId) => {
        client = clients[tlsSockId]
        if (client) {
            client.write('_+2')
        }
    })

    // Command listener to send shell commands to the client socket to execute
    socket.on('cmd', (data) => {
        console.log(`running: ${JSON.stringify(data)}`)
        client = clients[data.clientId]
        if (client) {
            // '0' is indicator for command function (check clientV2)
            client.write('_+0' + data.shellInput + '\n')
        } else {
            // If tlsSocket and socketIO are not bound (i.e. client is not found)
            socket.emit('cmdRes', 'Requested client could not be found')
        }
    })
})

module.exports = {
    httpServer
}