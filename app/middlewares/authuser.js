const passport = require('passport')
const HTTP = require('../../constants/responseCode.constant');

async function authuser(req, res, next) {
    passport.authenticate('jwt', { session: false }, function (err, userdata) {
        // console.log("🚀 ~ userdata:", req.headers)
        if (err) {
            console.log("🚀 ~ file: authuser.js:9 ~ err:", err)
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Err From Passport Middleware" })
        }
        if (userdata === false) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: "Please Authnticate Your Self" })
        }
        req.user = userdata;
        next()
    })(req, res, next);
}

module.exports = {
    authuser
}