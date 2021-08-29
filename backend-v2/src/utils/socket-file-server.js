const fs = require('fs')

const _EOT_ = '|||'

const receiveFile = async (clientSocket, destFilePath) => {
    //Receive file to specific directory
}

const initSendFileMsg = (filename) => {
    var msg = {
        type: 'fileServerToClient',
        data: filename
    }
    return JSON.stringify(msg)
}

const endSendFileMsg = () => {
    var msg = {
        type: 'endOfFile'
    }
    return JSON.stringify(msg)
}

const sendFile = async (clientSocket, srcFilePath, dstFileName) => {
    try {
        var srcFileStream = fs.createReadStream(__dirname + srcFilePath)

        srcFileStream.on('open', () => {
            // srcFileStream.pause()
            clientSocket.write(initSendFileMsg(dstFileName) + _EOT_)
        })

        srcFileStream.on('readable', () => {
            var chunk;
            
            while (null !== (chunk = readable.read())) {
                var msg = {
                    type: 'fileData',
                    data: chunk
                }
                
                clientSocket.write(JSON.stringify(msg) + _EOT_)
                //chunk has data, do something with chunk
            }
        })

        srcFileStream.on('error', () => {
            clientSocket.write(initSendFileMsg + _EOT_)
        })

        srcFileStream.on('end', () => {
            clientSocket.write(endSendFileMsg + _EOT_)
        })
    } catch (e) {
        console.log(`Error in socket-file-server: ${e}`)
    }
}

module.exports = {
    sendFile,
    receiveFile
}