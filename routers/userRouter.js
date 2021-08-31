const router = require('express').Router()
const db = require('better-sqlite3')('snaplist.db')
const { signToken, generateSaltAndHash, passwordMatchesHash, authenticate } = require('../auth/authUtils')

router.post('/login', async (req, res) => {
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

router.post('/username', authenticate, (req, res) => {
    const username = req.body.username
    if (!username) return res.status(400).json({ error: 'missing username' })
    const userId = req.user.userId
    const result = db.prepare('UPDATE users SET username=? WHERE id=?').run(username, userId)
    if (result.changes === 0) return res.status(500).send(result)
    const token = signToken({ username, userId, iat: Date.now() })
    res.send({ token })
})

router.post('/password', authenticate, (req, res) => {
    const password = req.body.password
    if (!password) return res.status(400).json({ error: 'missing password' })
    const { username, userId } = req.user
    const { salt, hash } = generateSaltAndHash(password)
    const result = db.prepare('UPDATE users SET salt=?, hash=? WHERE id=?').run(salt, hash, userId)
    if (result.changes === 0) return res.status(500).send(result)
    const token = signToken({ username, userId, iat: Date.now() })
    res.send({ token })
})

router.post('/delete', authenticate, (req, res) => {
    const { userId } = req.user
    const result = db.prepare('DELETE FROM users WHERE id=?').run(userId)
    if (result.changes === 0) return res.status(500).send(result)
    res.send({})
})

module.exports = router