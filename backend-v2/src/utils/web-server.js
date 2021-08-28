// Core Modules
const https = require('https')
const fs = require('fs')
const path = require('path')
// End  of Core Modules

// npm Modules
const express = require('express')
const hbs = require('hbs')
const socketio = require('socket.io')
const cookieParser = require('cookie-parser')
// End of npm modules

// certificate options
var key = fs.readFileSync(__dirname + '/../../certs/host.key')
var cert = fs.readFileSync(__dirname + '/../../certs/host.crt')
var tlsOptions = {
    key,
    cert
}
// end of cert options

// static paths
const publicDirectoryPath = path.join(__dirname, '../../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')
// end of static paths

// Express Routes
const mainRouter = require('./routes/main-router')
const userRouter = require('./routes/user-router')
const workstationRouter = require('./routes/workstation-router')
// End of Express Routes

// Express and Socket.io setup
const app = express()
const httpsServer = https.createServer(tlsOptions, app)
const io = socketio(httpsServer)
app.use(express.urlencoded({extended: true}))
// app.use(express.json())
// End of setup

// Setup HBS + Paths
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
// End of HBS Setup

// Setup Express to use public static path
app.use(express.static(publicDirectoryPath))
app.use(cookieParser())
app.use(workstationRouter)
app.use(userRouter)
app.use(mainRouter)
// End of public static path

module.exports = {
    httpsServer,
    io,
    tlsOptions
}