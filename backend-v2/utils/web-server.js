// Core Modules
const https = require('https')
const fs = require('fs')
const path = require('path')
// End  of Core Modules

// npm Modules
const express = require('express')
const hbs = require('hbs')
const socketio = require('socket.io')
// End of npm modules

// certificate options
var key = fs.readFileSync(__dirname + '/../server-cert/host.key')
var cert = fs.readFileSync(__dirname + '/../server-cert/host.cert')
var options = {
    key,
    cert
}
// end of cert options

// static paths
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')
// end of static paths

// Express Routes
const mainRouter = require('./routes/main-router')
// End of Express Routes

// Express and Socket.io setup
const app = express()
const httpsServer = https.createServer(options, app)
const io = socketio(httpsServer)
// End of setup

// Setup HBS + Paths
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
// End of HBS Setup

// Setup Express to use public static path
app.use(express.static(publicDirectoryPath))
app.use(mainRouter)
// End of public static path

module.exports = {
    httpsServer,
    io
}