// custom modules
const { server, clients, ioclients } = require('./utils/tls-com-sock')
const { fsServer, fsClients } = require('./utils/tls-file-sock')
const { httpServer } = require('./utils/sockio-web')
const prompt = require('./utils/prompt');

// Global Constants
const _comPort = 2222
const _fsPort = 2223
const _webPort = 3000
// ===================

/**
 * listen to incoming tls socket connections and pass by reference to utils/prompt function
 */
server.listen(_comPort, () => {
    console.log(`C&C Socket is live on port ${_comPort}`)

    prompt()
})

/**
 * Listen to incoming socket connection on port _fsPort
 */
fsServer.listen(_fsPort, () => {
    console.log(`FS Socket is live on port ${_fsPort}`)
})
/**
 * listen to http server on port _webPort
 */
httpServer.listen(_webPort, () => {
    console.log(`Webserver is live on port ${_webPort}`)
})