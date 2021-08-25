const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {
    try {
        const token = JSON.parse(req.cookies['nodeRS-cookie']).Authorization
        // const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'nodersSecretToken')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).redirect('/users/login')
    }
}

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