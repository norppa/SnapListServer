const router = require('express').Router()
const db = require('better-sqlite3')('snaplist.db')
const { signToken, generateSaltAndHash, passwordMatchesHash, authenticate } = require('../auth/authUtils')

router.post('/login', async (req, res) => {
    console.log('/login', req.body)
    const { username, password } = req.body
    if (!username) return res.status(400).json({ error: 'missing username' })
    if (!password) return res.status(400).json({ error: 'missing password' })

    const user = db.prepare('SELECT * FROM users WHERE username=?').get(username)
    if (!user) return res.status(401).json({ error: 'Username not found' })

    const { hash, salt } = user
    if (!passwordMatchesHash(password, salt, hash)) return res.status(401).json({ error: 'Incorrect password' })

    const token = signToken({ username, userId: user.id, iat: Date.now() })
    res.send(JSON.stringify({ token }))
})

router.post('/register', async (req, res) => {
    const { username, password } = req.body
    if (!username) {
        return res.status(400).json({ error: 'missing username' })
    }
    if (!password) {
        return res.status(400).json({ error: 'missing password' })
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username=?').get(username)
    if (existingUser) return res.status(400).send({ error: 'Username taken' })

    const { salt, hash } = generateSaltAndHash(password)
    const result = db.prepare('INSERT INTO users (username, salt, hash) VALUES (?,?,?)').run(username, salt, hash)
    if (result.changes !== 1) return res.status(500).send('Database error')
    const token = signToken({ username, userId: result.lastInsertRowid, iat: Date.now() })
    res.send(JSON.stringify({ token }))
})

module.exports = router