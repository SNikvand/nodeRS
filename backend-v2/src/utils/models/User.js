// NPM modules
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// ===========================================================================

// Global Variables
const _SECRET_ = 'nodersSecretToken'
// ===========================================================================

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    favourites: {
        type: [String],
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

/**
 * Generates an authentication token and stores it in the database
 * @returns generated token
 */
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, _SECRET_, {
        expiresIn: '7d'
    })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

/**
 * Compares credidentials provided with entry in database
 * @param {String} username 
 * @param {String} password 
 * @returns user profile
 */
userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ username })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// hash plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User