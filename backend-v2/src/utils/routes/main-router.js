// NPM Modules
const express = require('express')
// ===========================================================================

// Custom Modules
const {auth} = require('../middleware/auth')
// ===========================================================================

// Router Setup
const router = new express.Router()
// ===========================================================================


// on URL router '/' render index.hbs from templates/views/index.hbs
router.get('/', auth, (req, res) => {
    res.render('index', )
})

module.exports = router