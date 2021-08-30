// Core Modules
const tls = require('tls')
const fs = require('fs')
// ===========================================================================

// NPM Modules
const { nanoid } = require('nanoid')
const geoip = require('geoip-lite')
// ===========================================================================

// Custom Modules
const Workstation = require('../utils/models/Workstation')
const { io, tlsOptions } = require('./web-server')
// ===========================================================================

// Global Variables
const clients = {}
const _EOT_ = '|||' // Characters to identify end of transmission per write (not per packet)
// ===========================================================================

/**
 * uses the geoip-lite npm module to look up roughly where the IP is connecting from
 * @param {String} ipv4 - String formatted like an IPv4 Address '0.0.0.0' - '255.255.255.255'
 * @returns returns JSON object:{'latitude': Number, 'longitude': Number}
 */
const geoipLookup = (ipv4) => {
    if (ipv4 !== '127.0.0.1') {
        let location = geoip.lookup(ipv4)
        let locationJson = {
            'latitude': location.ll[0],
            'longitude': location.ll[1]
        }
        return locationJson
    }
    return {'latitude': 0, 'longitude': 0}
}

/**
 * this function will emit 'workstation' event to the frontend with:
 * workstationId, ipv4, location, and a custom name
 * @param {Socket} clientSocket 
 */
const ioEmitNewConnect = (clientSocket) => {
    io.emit('workstation', {
        'id': clientSocket.workstationId, 
        'ip': clientSocket.ipv4Addr,
        'll': clientSocket.location,
        'prettyName': clientSocket.prettyName
    })
}

/**
 * This function will be called when the client socket disconnects. This function
 * will emit a "removeWorkstationMarket" event to the front end to remove a map marker
 * @param {Socket} clientSocket 
 */
const ioEmitEndConnect = (clientSocket) => {
    io.emit('removeWorkstationMarker', {
        'id': clientSocket.workstationId
    })
}

/**
 * this function will run when the clientSocket disconnects. using the workstationId
 * it will update the entry in the database and set the document.alive to false
 * @param {String} workstationId 
 */
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

/**
 * when a brand new client connects to this server and no settings exist for this device
 * in the database it will generate a new id and go through a setup/handshake process
 * @param {Socket} clientSocket 
 */
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
        'location': clientSocket.location,
        'alive': true
    })

    try {
        await workstation.save()
    } catch (e) {
        console.log(`Unable to save ${workstation} to database. \n ${e}`)
    }
}

/**
 * Once a message arrived from the client the function will transmit the response to the
 * client front end (on the web) in a room labled by "workstationId" and emit a 'execResponse' event
 * @param {JSON} JBuffer 
 * @param {Socket} clientSocket 
 */
const execResponse = (JBuffer, clientSocket) => {
    io.to(clientSocket.workstationId).emit('execResponse', JBuffer.data)
}

/**
 * when a client connects and is an existing client within the database, no new ID is assigned
 * however the database record is updated with the latest IP/Location
 * @param {JSON} JBuffer 
 * @param {Socket} clientSocket 
 * @returns 
 */
const existingClient = async (JBuffer, clientSocket) => {
    clientSocket.workstationId = JBuffer.id
    clientSocket.location = geoipLookup(clientSocket.ipv4Addr)
    clients[clientSocket.workstationId] = clientSocket

    try {
        const workstation = await Workstation.findOne({'workstationId': clientSocket.workstationId})
        
        // Generate new ID for workstation if it doesn't exist in the DB
        if (!workstation) {
            return newClientSock(clientSocket)
        }

        if (workstation.prettyName !== '' || workstation.prettyName != undefined) {
            clientSocket.prettyName = workstation.prettyName
        }

        ioEmitNewConnect(clientSocket)
        workstation.lastIp = clientSocket.ipv4Addr
        workstation.location = clientSocket.location
        workstation.alive = true
        await workstation.save()
    } catch (e) {
        console.log(e)
    }
}

const dataWriteFile = (JBuffer, clientSocket) => {
    clientSocket.fileWriteStream.write(Uint8Array.from(JBuffer.data.data))
}

const endWriteFile = (clientSocket) => {
    console.log(`finished writing file`)
    io.to(clientSocket.workstationId).emit('execResponse', `Download Complete. File saved under ./downloads/${clientSocket.workstationId}/`)
    clientSocket.fileWriteStream.close()
}

/**
 * purpose of this function is to take the JSON buffer data recieved from the client
 * and interpret what function  to run.
 * @param {JSON} JBuffer 
 * @param {Socket} clientSocket 
 */
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
        case 'fileData':
            dataWriteFile(JBuffer, clientSocket)
            break
        case 'endOfFile':
            endWriteFile(clientSocket)
            break
    }
}

/**
 * Communication Socket Server Listener with tls encryption. every time a new client connects
 * to this socket server the functions below execute for that specific socket
 */
const comSockServer = tls.createServer(tlsOptions, (clientSocket) => {
    
    clientSocket.comBuffer = '' //Communication buffer
    clientSocket.ipv4Addr = clientSocket.remoteAddress.replace(/^.*:/, '')
    
    // when the server recieves data from the client send buffer to the BufferInterpreter function
    clientSocket.on('data', (data) => {
        var dataString = data.toString()
        clientSocket.comBuffer += dataString
        var endOfTransmissionIndex = clientSocket.comBuffer.indexOf(_EOT_) // will return -1 if nothing found

        while (endOfTransmissionIndex > 0) {
            var tempBuffer = clientSocket.comBuffer.substr(0, endOfTransmissionIndex)
            
            try {
                var JBuffer = JSON.parse(tempBuffer)
                bufferInterpreter(JBuffer, clientSocket)
            } catch (e) {
                console.log(`Buffer Error ${e}: ${tempBuffer}`)
            }

            clientSocket.comBuffer = clientSocket.comBuffer.substr(endOfTransmissionIndex + 3)
            endOfTransmissionIndex = clientSocket.comBuffer.indexOf(_EOT_)
        }   
    })

    // When server recieves close function from client handle closeout procedure
    clientSocket.on('close', () => {
        console.log(`Client has disconnected ${clientSocket.workstationId}`)
        setWorkstationInactive(clientSocket.workstationId)
        ioEmitEndConnect(clientSocket)
        delete clients[clientSocket.workstationId]
    })

    // when server recieves error functino from client do closeout procedure
    clientSocket.on('error', (error) => {
        console.log(`Client experienced an error ${clientSocket.workstationId}: ${error}`)
        setWorkstationInactive(clientSocket.workstationId)
        ioEmitEndConnect(clientSocket)
        delete clients[clientSocket.workstationId]
    })
})

module.exports = {
    comSockServer,
    clients,
    _EOT_
}