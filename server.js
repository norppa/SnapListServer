const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/', require('./routers/router'))

const PORT = 3004

app.listen(PORT)