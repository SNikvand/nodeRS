// Npm modules
const jwt = require('jsonwebtoken')
// ===========================================================================

// Custom Modules
const User = require('../models/User')
// ===========================================================================

// Validates is the use is properly authenticated with a token
const auth = async (req, res, next) => {
    try {
        const token = JSON.parse(req.cookies['nodeRS-cookie']).Authorization
        const decoded = jwt.verify(token, 'nodersSecretToken')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        res.locals.user = user
        next()
    } catch (e) {
        res.status(401).redirect('/users/login')
    }
}

// Verifies to make sure that the user is not logged in or authenticated
const noAuth = async (req, res, next) => {
    try {
        const token = JSON.parse(req.cookies['nodeRS-cookie']).Authorization
        const decoded = jwt.verify(token, 'nodersSecretToken')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        res.redirect('/')
    } catch (e) {
        next()
    }
}

module.exports = {
    auth,
    noAuth
}