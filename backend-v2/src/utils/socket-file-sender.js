// Core Modules
const fs = require('fs')
// ===========================================================================

// Global Variables
const _EOT_ = '|||'
// ===========================================================================

/**
 * Creates formatted message for client to initiate sending files from Server to Client
 * @param {String} filename name of file to transmit to client
 * @returns string JSON object
 */
const initSendFileMsg = (filename) => {
    var msg = {
        type: 'fileServerToClient',
        data: filename
    }
    return JSON.stringify(msg)
}

/**
 * Creates a formatted message to notify client that file transfer is complete
 * @returns string JSON object
 */
const endSendFileMsg = () => {
    var msg = {
        type: 'endOfFile'
    }
    return JSON.stringify(msg)
}

/**
 * Main function to read a file and transmit the data from server to client
 * @param {Socket} clientSocket client socket object
 * @param {String} srcFilePath source file to be sent to client
 * @param {String} dstFileName name of file for client to store in ./
 * @param {Function} cb callback function
 */
const sendFile = async (clientSocket, srcFilePath, dstFileName, cb) => {
    if (fs.existsSync(srcFilePath)) {
        try {
            var srcFileStream = fs.createReadStream(srcFilePath)
    
            srcFileStream.on('open', () => {
                clientSocket.write(initSendFileMsg(dstFileName) + _EOT_)
            })
    
            srcFileStream.on('readable', () => {
                var chunk;
                
                while (null !== (chunk = srcFileStream.read())) {
                    var msg = {
                        type: 'fileData',
                        data: chunk
                    }
    
                    clientSocket.write(JSON.stringify(msg) + _EOT_)
                }
            })
    
            srcFileStream.on('error', (e) => {
                clientSocket.write(endSendFileMsg() + _EOT_)
                cb(e)
            })
    
            srcFileStream.on('end', () => {
                clientSocket.write(endSendFileMsg() + _EOT_)
                cb('File is sent.')
            })
        } catch (e) {
            console.log(`Error in socket-file-server: ${e}`)
            cb(e)
        }
    }
}

module.exports = {
    sendFile
}