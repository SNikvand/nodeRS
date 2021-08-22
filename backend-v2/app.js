// Custom Modules
const { httpsServer } = require('./utils/web-server')
require('./utils/socketio-listener') // Required to run socketio events
// End of custom modules

const _HTTPS_PORT_ = 8443

httpsServer.listen(_HTTPS_PORT_, () => {
    console.log(`https server is now live on port ${_HTTPS_PORT_}. https://localhost:8443`)
})