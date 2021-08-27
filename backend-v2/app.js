// Custom Modules
const { httpsServer } = require('./src/utils/web-server')
const { comSockServer } = require('./src/utils/socket-com-server')
require('./src/utils/socketio-listener') // Required to run socketio events
require('./src/utils/db/mongoose') // Required to connect to database
// End of custom modules

const _HTTPS_PORT_ = 8443
const _COM_SOCK_PORT_ = 443

httpsServer.listen(_HTTPS_PORT_, () => {
    console.log(`https server is now live on port ${_HTTPS_PORT_}. https://localhost:8443`)
})

comSockServer.listen(_COM_SOCK_PORT_, () => {
    console.log(`socket server is now live on port ${_COM_SOCK_PORT_}.`)
})