const mongoose = require('mongoose')

const User = mongoose.model('User', {
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    favourites: {
        type: [String]
    }
})

module.exports = User