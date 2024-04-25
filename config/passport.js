const passport = require('passport')
const User = require("../app/Models/userModel")
require('dotenv').config({ path: './config/.env' })


var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
    const userdata = await User.findOne({ _id: jwt_payload._id })
      if (userdata) {
        return done(null, userdata);
    } else {
        return done(null, false);
        // or you could create a new account
    }
}));