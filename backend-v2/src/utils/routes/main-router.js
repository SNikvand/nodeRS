const express = require('express')
const router = new express.Router

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/users', (req, res) => {
    res.render('users')
})

module.exports = router