// NPM Modules
const express = require('express')
const dayjs = require('dayjs')
// ===========================================================================

// Custom Modules
const User = require('../models/User')
const {auth, noAuth} = require('../middleware/auth')
// ===========================================================================

// Router Setup
const router = new express.Router()
// ===========================================================================

// on get /users router render users.hbs view with all users from database (using Auth middleware)
router.get('/users', auth, async (req, res) => {
    var users = await User.find({}).select('username _id')

    res.render('users', { users })
})

// on post /users save a new user (using auth middleware)
router.post('/users', auth, async (req, res) => {
    
    const user = new User(req.body)
    try {
        await user.save()
        res.redirect('/users')
    } catch (e) {
        res.status(400).redirect('/users')
    }
})

// on deete /users delete a user (using auth middleware)
router.delete('/users', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.query.id)

        if(!user) {
            return res.status(404).send()
        }

        res.send(`${user.username} was remove from the database`)
    } catch (e) {
        console.log('User Delete Router: ' + e)
    }
})

// on get /users/login display login (noAuth middleware check to make sure user is not logged in)
router.get('/users/login', noAuth, (req, res) => {
    res.render('login')
})

// on post /users/login attempt to log in the user and create a token + add to cookie
router.post('/users/login', noAuth, async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        const cookieData = {
            'Authorization': token
        }

        res.cookie('nodeRS-cookie', JSON.stringify(cookieData), {
            secure: true,
            httpOnly: true,
            expires: dayjs().add(7, "days").toDate(),
        })

        res.redirect('/')
    } catch {
        res.redirect('/users/login')
    }
})

// on post /users/logout remove token from their profile and clear cookie settings
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        
        await req.user.save()
        res.clearCookie('nodeRS-cookie')
        res.redirect('/users/login')
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router