// Custom Modules
const { io } = require('./web-server')
const { clients } = require('./socket-com-server')
// end of custom modules

io.on('connection', (socket) => {
    Object.keys(clients).forEach((key) => {
        socket.emit('workstation', {
            'id': clients[key].workstationId, 
            'ip': clients[key].ipv4Addr,
            'll': clients[key].location
        })
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