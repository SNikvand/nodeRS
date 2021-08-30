// Core Modules
const fs = require('fs')
// end of Core Modules

// Custom Modules
const { io } = require('./web-server')
const { clients, _EOT_ } = require('./socket-com-server')
const { sendFile } = require('./socket-file-sender')
const Workstation = require('./models/Workstation')
// end of custom modules

/**
 * fetch all "alive" workstations from the database and emit
 * to front end the id, ip, location, and custom name
 * @param {Socket} ioSocket 
 */
const sendExistingOpenSockets = async (ioSocket) => {
    dbClients = await Workstation.find({'alive': true})

    Object.keys(dbClients).forEach((key) => {
        var msg = {
            'id': dbClients[key].workstationId, 
            'ip': dbClients[key].lastIp,
            'll': dbClients[key].location,
            'prettyName': dbClients[key].prettyName
        }
        ioSocket.emit('workstation', msg)
    })
}

/**
 * socketio is used for frontend management only.
 */
io.on('connection', async (socket) => {
    sendExistingOpenSockets(socket)

    // Subscribe frontend socket to a room dedicated to a specific workstationId
    socket.on('joinWorkstation', (data) => {
        socket.join(data.workstationId)
    });

    // unsubscribe frontend socket from a room dedicated to a specific workstationId
    socket.on('exitWorkstation', (data) => {
        socket.leave(data.workstationId)
    })

    // when a terminal exec command is recieved from front end transmit to client socket
    socket.on('execWorkstation', (data) => {
        var msg = {
            'type': 'exec',
            'data': data.cmd
        }
        try {
            clients[data.workstationId].write(JSON.stringify(msg) + _EOT_)
        } catch (e) {
            socket.emit('test', {
                e
            })
        }
    })

    socket.on('fileServerToClient', (data) => {
        // console.log(data)
        sendFile(clients[data.workstationId], data.srcFilePath, data.dstFileName, (response) => {
            socket.emit('execResponse', response)
        })
    })

    socket.on('fileClientToServer', (data) => {
        var dir = `./downloads/${data.workstationId}`
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            clients[data.workstationId].fileWriteStream = fs.createWriteStream(dir + `/${data.serverFileName}`)

            var msg = {
                'type': 'fileClientToServer',
                'data': data.clientFilePath
            }
            clients[data.workstationId].write(JSON.stringify(msg) + _EOT_)

        } catch (e) {
            socket.emit('execResponse', e)
        }
    })
})
