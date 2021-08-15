const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')
const { PUBLIC_KEY } = require('./authUtils')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUBLIC_KEY,
    algorithms: ['PS512']
}

module.exports = (passport) => {
    passport.use(new JwtStrategy(options, async (payload, done) => {
        done(null, { username: payload.username, userId: payload.userId })
    }))
}