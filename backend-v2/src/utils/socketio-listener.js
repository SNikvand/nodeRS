// Custom Modules
const { io } = require('./web-server')
// end of custom modules

io.on('connection', (socket) => {
    socket.emit('hello')
})