//=================================userEmail.js================================

const nodemailer = require("nodemailer");
const fs = require("fs");
const handlebars = require("handlebars");

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  service: "gmail",
  auth: {
    user: "info@wavebot.app",
    pass: "v v h m q r w z h u q x f o k m",
  },
});

const sendMail = (data) => {
  const templetpath = data.templetpath;
  fs.readFile(templetpath, { encoding: "utf-8" }, function (err, html) {
    var template = handlebars.compile(html);
    var htmlToSend = template({
      username: data.name,
      email: data.email,
      otp: data.otp,
    });

    var mailOptions = {
      from: "test.project7312@gmail.com",
      to: data.email,
      subject: "Email OTP Verification",
      //html: `<p>Please verify Your OTP : <h1>${data.otp}</h1></p>`
      html: htmlToSend,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email sent successfully");
      }
    });
  });
};

const welcomeSendMail = (data) => {
  const templetpath = data?.templetpath;
  fs.readFile(templetpath, { encoding: "utf-8" }, function (err, html) {
    var template = handlebars.compile(html);
    var htmlToSend = template({
      username: data?.username,
      createdAt: data?.createdAt,
    });

    var mailOptions = {
      from: "test.project7312@gmail.com",
      to: data?.email,
      subject: "Email OTP Verification",
      //html: `<p>Please verify Your OTP : <h1>${data.otp}</h1></p>`
      html: htmlToSend,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("welcomeEmail sent successfully!!");
      }
    });
  });
};

module.exports = {
  sendMail,
  welcomeSendMail,
};
