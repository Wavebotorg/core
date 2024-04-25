//=================================userEmail.js================================

const nodemailer = require('nodemailer');
const fs = require('fs');
const handlebars = require('handlebars');

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    service: 'gmail',
    auth: {
        user: 'test.project7312@gmail.com',
        pass: 'apis tsfn jznu ajlm'
    }
});

const sendMail = (data) => {
    console.log("🚀 ~ file: useremail.js:37 ~ sendMail ~ data:", data)
    // const templetpath = data.templetpath
    // console.log("🚀 ~ file: useremail.js:40 ~ sendMail ~ templetpath:", templetpath)
    // fs.readFile(templetpath, { encoding: 'utf-8' }, function (err, html) {

        // var template = handlebars.compile(html);
        // var htmlToSend = template({ username: data.name, email: data.email, otp : data.otp });

        var mailOptions = {
            from: 'test.project7312@gmail.com',
            to: data.email,
            subject: 'Email OTP Verification',
            html: `<p>Please verify Your OTP : <h1>${data.otp}</h1></p>`
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error.message);
            } else {
                console.log('Email sent successfully');
            }
        });
    // })
}


module.exports = {
    sendMail,
}