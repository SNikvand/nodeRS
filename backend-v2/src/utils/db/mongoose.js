const mongoose = require('mongoose')
const { nanoid } = require('nanoid')

mongoose.connect('mongodb://127.0.0.1:27017/noders', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})