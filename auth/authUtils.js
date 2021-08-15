const jsonwebtoken = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs');
const path = require('path')
const passport = require('passport')

const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, './keys', 'ecdsa-p521-private.pem'), 'utf8')
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, './keys', 'ecdsa-p521-public.pem'), 'utf8')

const signToken = (payload) => {
    console.log('payload', payload)
    return jsonwebtoken.sign(payload, PRIVATE_KEY, { algorithm: 'PS512' })
}

const iterations = 10000
const keylen = 64
const digest = 'sha512'

const generateSaltAndHash = (password) => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex')
    return { salt, hash }
}

const passwordMatchesHash = (password, salt, hash) => {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex') === hash
}

const authenticate = passport.authenticate('jwt', { session: false })

module.exports = {
    signToken,
    generateSaltAndHash,
    passwordMatchesHash,
    PRIVATE_KEY,
    PUBLIC_KEY,
    authenticate
}