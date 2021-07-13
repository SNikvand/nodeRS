const readline = require('readline')
const chalk = require('chalk')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Purpose: this function handles individual client commands.
 * "exit" will exit controlling this specific selected client
 * "msg" will send a basic console.log() message to the client to display
 * "run" will execute a shell command on client computer
 * 
 * @param {*} clients : ref to all connected clients to server
 * @param {*} client : ref to specific client to execute commands
 */
const clientPrompt = (clients, client) => {
    rl.question(`${client.connID}> `, (input) => {
        tokens = input.split(" ")

        switch(tokens[0]) {
            case 'exit':
                prompt(clients)
                break
            case 'msg':
                client.write(input.substr(4))
                break
            case 'run':
                client.write(input.substr(4)+'\n')
                //client.write('0' + input.substr(4))
                break
            default:
                break
        }
        clientPrompt(clients, client)
    })    
}

/**
 * Purpose: global prompt which handles cli commands to all clients
 * "lis" will display all connected clients on the server
 * "ann" will send an announcement to console.log on all connected clients
 * "sel" will call clientPrompt() function and select using the unique socket.connID handled in ../server.js
 * 
 * @param {*} clients : ref to all connected clients to server
 */
const prompt = (clients) => {
    rl.question(`global> `, (input) => {
        tokens = input.split(" ")
        switch (tokens[0]) {
            case 'lis':
                Object.keys(clients).forEach((key) => {
                    console.log(key)
                })
                break
            case 'ann':
                Object.keys(clients).forEach((key) => {
                    client = clients[key]
                    client.write(input.substr(4))
                })
                break
            case 'sel':
                if (clients[tokens[1]]) {
                    clientPrompt(clients, clients[tokens[1]])
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
        prompt(clients)
    })
}

module.exports = prompt