const fs = require('fs')

const _EOT_ = '|||'

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