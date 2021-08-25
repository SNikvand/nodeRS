const express = require('express')
const dayjs = require('dayjs')
const router = new express.Router()
const User = require('../models/User')
const {auth, noAuth} = require('../middleware/auth')


// RENDER USERS PAGE WITH ALL USERS
router.get('/users', auth, async (req, res) => {
    var users = await User.find({}).select('username _id')

    res.render('users', { users })
})

// SAVE A NEW USER AND REDIRECT TO '/users' GET
router.post('/users', auth, async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        res.redirect('/users')
    } catch (e) {
        res.status(400).redirect('/users')
    }
})

// DELETE A USER
router.delete('/users', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.query.id)

        if(!user) {
            return res.status(404).send()
        }

        res.send(`${user.username} was remove from the database`)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/login', noAuth, (req, res) => {
    res.render('login')
})

router.post('/users/login', async (req, res) => {
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
        res.status(400).redirect('/users/login')
    }
})

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