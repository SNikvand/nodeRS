// Custom Modules
const { io } = require('./web-server')
const { clients } = require('./socket-com-server')
const Workstation = require('./models/Workstation')
// end of custom modules

io.on('connection', async (socket) => {
    dbClients = await Workstation.find({'alive': true})

    Object.keys(dbClients).forEach((key) => {
        var msg = {
            'id': dbClients[key].workstationId, 
            'ip': dbClients[key].lastIp,
            'll': dbClients[key].location,
            'prettyName': dbClients[key].prettyName
        }
        socket.emit('workstation', msg)
    })

    socket.on('joinWorkstation', (data) => {
        socket.join(data.workstationId)
    });

    socket.on('exitWorkstation', (data) => {
        socket.leave(data.workstationId)
    })

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
})
