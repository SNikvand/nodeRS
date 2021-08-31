const express = require('express')
const router = new express.Router()
const Workstation = require('../models/Workstation')
const {auth} = require('../middleware/auth')

router.get('/workstations', auth, async (req, res) => {
    try {
        var workstations = await Workstation.find()
        res.render('workstations', {"partial": "workstation_list", workstations})
    } catch (e) {
 
    }
})

router.get('/workstations/:id', auth, async (req, res) => {
    const workstationId = req.params.id
    try {
        var workstation = await Workstation.findOne({workstationId})
        res.render('workstations', {"partial": "workstation", workstation})
    } catch (e) {
        console.log(e)
    }
})

router.post('/workstations/:id', auth, async (req, res) => {
    const workstationId = req.params.id
    try {
        var workstation = await Workstation.findOne({workstationId})
        workstation.prettyName = req.body.prettyName
        await workstation.save()
        res.redirect('/workstations')
    } catch (e) {
        console.log(e)  
    }
})

router.post('/workstations/fave/:id', auth, async (req, res) => {
    const workstationId = req.params.id
    try {
        if (!req.user.favourites.includes(workstationId)) {
            req.user.favourites.push(workstationId)
            await req.user.save()
        } else {
            req.user.favourites = req.user.favourites.filter(fave => fave !== workstationId)
            await req.user.save()
        }
    } catch (e) {
        console.log
    }
})

router.delete('/workstations/:id', auth, async (req, res) => {
    const workstationId = req.params.id
    try {
        await Workstation.findOneAndDelete({workstationId})
        res.redirect('/workstations')
    } catch (e) {
        console.log(e)  
    }
})

module.exports = router