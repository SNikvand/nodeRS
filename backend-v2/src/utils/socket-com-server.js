const tls = require('tls')
const fs = require('fs')
const { nanoid } = require('nanoid')
const geoip = require('geoip-lite')
const Workstation = require('../utils/models/Workstation')
const { io } = require('./web-server')


var clients = {}
const _EOT_ = '|||' // Characters to identify end of transmission per write (not per packet)

const tlsOptions = {
    key: fs.readFileSync(__dirname + '/../../certs/host.key'),
    cert: fs.readFileSync(__dirname + '/../../certs/host.crt')
}

const geoipLookup = (ipv4) => {
    if (ipv4 !== '127.0.0.1') {
        let location = geoip.lookup(clientSocket.ipv4Addr)
        let locationJson = {
            'latitude': location[0],
            'longitude': location[1]
        }
        return locationJson
    }
    return {'latitude': 0, 'longitude': 0}
}

const ioEmitNewConnect = (clientSocket) => {
    io.emit('workstation', {
        'id': clientSocket.workstationId, 
        'ip': clientSocket.ipv4Addr,
        'll': clientSocket.location
    })
}

const setWorkstationInactive = async (workstationId) => {
    try {
        const workstation = await Workstation.findOne({workstationId})

        if (!workstation) {
            throw new Error
        }

        workstation.alive = false
        await workstation.save()
    } catch (e) {
        console.log(`could not set ${workstationId} to inactive`)
    }
}

const newClientSock = async (clientSocket) => {
    clientSocket.workstationId = nanoid(10)
    var initMsg = {
        'type': 'setup',
        'id': clientSocket.workstationId
    }
    clientSocket.write(JSON.stringify(initMsg) + _EOT_)
    clientSocket.location = geoipLookup(clientSocket.ipv4Addr)
    clients[clientSocket.workstationId] = clientSocket
    ioEmitNewConnect(clientSocket)

    const workstation = new Workstation({
        'workstationId': clientSocket.workstationId,
        'lastIp': clientSocket.ipv4Addr,
        'location': geoipLookup(clientSocket.ipv4Addr),
        'alive': true
    })

    try {
        await workstation.save()
    } catch (e) {
        console.log(`Unable to save ${workstation} to database. \n ${e}`)
    }
}

const execResponse = (JBuffer, clientSocket) => {
    io.to(clientSocket.workstationId).emit('execResponse', JBuffer.data)
}

const existingClient = async (JBuffer, clientSocket) => {
    clientSocket.workstationId = JBuffer.id
    clientSocket.location = geoipLookup(clientSocket.ipv4Addr)
    clients[clientSocket.workstationId] = clientSocket
    ioEmitNewConnect(clientSocket)

    try {
        const workstation = await Workstation.findOne({'workstationId': clientSocket.workstationId})

        // Generate new ID for workstation if it doesn't exist in the DB
        if (!workstation) {
            return newClientSock(clientSocket)
        }

        workstation.lastIp = clientSocket.ipv4Addr
        workstation.location = geoipLookup(clientSocket.ipv4Addr)
        workstation.alive = true
        await workstation.save()
    } catch (e) {
        console.log(e)
    }
}

const bufferInterpreter = (JBuffer, clientSocket) => {
    switch (JBuffer.type) {
        case 'setupRequest':
            newClientSock(clientSocket)
            break
        case 'execResponse':
            execResponse(JBuffer, clientSocket)
            break
        case 'existingClient':
            existingClient(JBuffer, clientSocket)
            break
        case 'echo':
            // execResponse(JBuffer, clientSocket)
            break
    }
}

const comSockServer = tls.createServer(tlsOptions, (clientSocket) => {
    
    clientSocket.comBuffer = ''
    clientSocket.ipv4Addr = clientSocket.remoteAddress.replace(/^.*:/, '')
    if (clientSocket.ipv4Addr !== '127.0.0.1') {
        clientSocket.geo = geoip.lookup(clientSocket.ipv4Addr)

        // TEST LINE DELETE LATER
        console.log(clientSocket.workstationId + ' ' + clientSocket.ipv4Addr + ' ' + clientSocket.geo.ll)
    }
    
    // clients[clientSocket.workstationId] = clientSocket

    clientSocket.on('data', (data) => {
        var dataString = data.toString()
        var endOfTransmissionIndex = dataString.indexOf(_EOT_) // will return -1 if nothing found
        if (endOfTransmissionIndex > 0 ) {
            clientSocket.comBuffer += dataString.substr(0, endOfTransmissionIndex)
            
            console.log(dataString)
            try {
                var JBuffer = JSON.parse(clientSocket.comBuffer)
                console.log(JBuffer)
                bufferInterpreter(JBuffer, clientSocket)
            } catch (e) {
                console.log(e)
            }

            clientSocket.comBuffer = ''
        } else {
            clientSocket.comBuffer += data
        }
    })

    clientSocket.on('close', () => {
        console.log(`Client has disconnected ${clientSocket.workstationId}`)
        setWorkstationInactive(clientSocket.workstationId)
        delete clients[clientSocket.workstationId]
    })

    clientSocket.on('error', (error) => {
        console.log(`Client experienced an error ${clientSocket.workstationId}: ${error}`)
        setWorkstationInactive(clientSocket.workstationId)
        delete clients[clientSocket.workstationId]
    })
})

module.exports = {
    comSockServer,
    clients
}