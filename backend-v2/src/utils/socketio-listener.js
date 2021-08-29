// Custom Modules
const { io } = require('./web-server')
const { clients } = require('./socket-com-server')
const { sendFile, receiveFile } = require('./socket-file-server')
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
            clients[data.workstationId].write(JSON.stringify(msg) + '|||')
        } catch (e) {
            socket.emit('test', {
                e
            })
        }
    })

    socket.on('fileServerToClient', (data) => {
        // console.log(data)
        sendFile(clients[data.workstationId], data.srcFilePath, data.dstFileName)
    })
})
