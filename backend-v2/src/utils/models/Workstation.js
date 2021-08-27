const mongoose = require('mongoose')
const { nanoid } = require('nanoid')

const workstationSchema = new mongoose.Schema({
    workstationId: {
        type: String,
        unique: true,
        required: true
    },
    lastIp: {
        type: String
    },
    location: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        }
    },
    prettyName: {
        type: String
    },
    encryptionKey: {
        type: String,
        default: () => nanoid(16)
    },
    alive: {
        type: Boolean
    }
})

const Workstation = mongoose.model('Workstation', workstationSchema)

module.exports = Workstation