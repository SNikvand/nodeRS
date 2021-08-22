const mongoose = require('mongoose')

const Workstation = mongoose.model('Workstation', {
    workstation_id: {
        type: String,
        default: () => nanoid(10)
    },
    last_ip: {
        type: String
    },
    location: {
        type: [Number]
    },
    pretty_name: {
        type: String
    },
    encryption_key: {
        type: String,
        default: () => nanoid(16)
    }
})

module.exports = Workstation