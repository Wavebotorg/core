const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const HTTP = require("../../constants/responseCode.constant")
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    service: 'gmail',
    auth: {
        user: 'test.project7312@gmail.com',
        pass: 'apis tsfn jznu ajlm'
    }
});
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
};

// ============================== Default SignUp =================================

(async (req, res) => {
    try {
        const admin = {
            name: "Admin",
            email: "dmeet1008@gmail.com",
            // email: "mohit@wavebot.app",
            password: await bcrypt.hash("admin@123", 10),
            role: "admin",
            verify: true,
        }
        const checkEmail = await userModel.findOne({ email: admin.email })
        if (checkEmail) return;
        userModel(admin).save();
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }

})();


// -------------------------------- Admin Login --------------------------------  

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const checkEmail = await userModel.findOne({ email: email, role: 'admin' })
        if (!checkEmail) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Invalid Crendtials" });
        if (await bcrypt.compare(password, checkEmail.password)) {
            const token = jwt.sign({ _id: checkEmail._id }, process.env.SECRET_KEY)
            if (!token) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Something Went Wrong" });
            return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "Success", token: token });
        }
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Invalid Crendtials" });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Get Update Profile --------------------------------

const getUpdateProfile = async (req, res) => {
    try {
        const profile = await userModel.findById(req.user._id).select('-password -_id -role');
        if (!profile) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User Not Found" })
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: profile })
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Update Profile --------------------------------

const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const profile = await userModel.findById(req.user._id).select('-password -_id -role');
        if (!profile) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User Not Found" });

        let updatedProfile = profile;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;

        updatedProfile = await userModel.findByIdAndUpdate(req.user._id, updateFields, { new: true });
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: updatedProfile });


    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Change Password --------------------------------

const changePassword = async (req, res) => {
    try {
        const { cuPass, newPass, coPass } = req.body;
        const user = await userModel.findById(req.user._id).select("password");

        if (!user) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User Not Found" });

        if (cuPass !== user.password) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Invalid Credential" });
        if (cuPass === newPass) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Your Current Password and New Password Are the Same" });
        if (newPass !== coPass) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "New Password and Confirmation Password Do Not Match" });
        user.password = newPass;
        await user.save();

        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "Password updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Show All User--------------------------------  

const showAllUser = async (req, res) => {
    try {
        let userData = await userModel.find(
            { role: "user" }
        ).select('-password -otp -role');
        if (!userData || userData.length === 0) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "No users found" });
        }

        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "Here are the users", data: userData });
    }
    catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Show Particular User --------------------------------  

const showUser = async (req, res) => {
    try {
        const { id } = req.params;
        let userData = await userModel.find(
            { _id: id, role: "user" }
        ).select('-password -otp -role');
        if (!userData || userData.length === 0) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "No users found" });
        }
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "Here are the users", data: userData });
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Delete User By Admin --------------------------------  

const deleteUser = async (req, res) => {
    try {

        const { id } = req.params;
        const userData = await userModel.findById(id);
        if (!userData) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User Not Found" });
        await userModel.findByIdAndDelete(id);
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Blocked Or UnBlocked User --------------------------------  

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "Something Went Wrong" });
        const user = await userModel.findOne({ _id: userId }).select("email isActive");
        if (!user) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User not found" });
        user.isActive = !user.isActive;
        await user.save();

        const mailOptions = {
            from: "test.project7312@gmail.com",
            to: user.email,
            subject: `You are now ${user.isActive ? "Active" : "Deactive"} by administrator`,
            html: `<b>You Are ${user.isActive ? "Unblocked" : "Blocked"}</b>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error("Error sending email:", error);
            else console.log("Email sent:", info.response);
        });

        res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "User Status Updated Successfully", user });
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Forgot Password Admin  // Send OTP Email // --------------------------------

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Enter Valid Email" });
        const otp = generateOTP();
        const htmlTemplate = `
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Email</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
            /* Add your CSS styles here */
            body {
                font-family: 'Roboto', sans-serif;
                background-color: #f0f0f0;
                margin: 0;
                padding: 0;
                height: 100vh;
                display: grid;
                place-items: center;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333333;
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 30px;
            }
            .otp {
                color: #4caf50;
                font-size: 48px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 50px;
                border: 2px solid #4caf50;
                border-radius: 8px;
                padding: 20px;
            }
            p {
                color: #666666;
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .footer {
                color: #999999;
                font-size: 14px;
                text-align: center;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to Our Service</h1>
            <p>Your One-Time Password (OTP) for login:</p>
            <p class="otp">${otp}</p>
            <p>Please use this OTP to complete your login process.</p>
            <p class="footer">This email was sent automatically. Please do not reply.</p>
        </div>
    </body>
    </html>
`;

        const mailOptions = {
            from: 'test.project7312@gmail.com',
            to: email,
            subject: 'Your OTP for Login',
            html: htmlTemplate
        };

        // Send email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })

            } else {
                console.log('Email sent:', info.response);
                await userModel.findOneAndUpdate({ email: email, role: "admin" }, { otp: otp })
                return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "OTP Sent Successfully" })
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })

    }
}


// -------------------------------- Verify OTP User --------------------------------

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Enter Valid OTP" });
        }

        const userData = await userModel.findOneAndUpdate(
            { email, role: 'admin', otp },
            { otp: 0 },
            { new: true }
        );

        if (!userData) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Enter Valid Email or OTP" });
        }

        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "OTP Verify Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })

    }
}


// -------------------------------- Update User Password --------------------------------

const updatePassword = async (req, res) => {
    try {
        const { email, newPass, cPass } = req.body;
        if (!email || newPass !== cPass) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.UNAUTHORIZED, msg: "Enter Valid Password" });
        }
        const user = await userModel.findOneAndUpdate(
            { email, role: 'admin' },
            { password: newPass },
            { new: true }
        );
        if (!user) {
            return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.NOT_FOUND, msg: "User not found" });
        }
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: "Password Change Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })

    }
}


// -------------------------------- User Count By Period --------------------------------

const getUsersCountByPeriod = async (req, res) => {
    try {

        // user na count 

        const oneWeekAgo = moment().subtract(1, 'week');
        const oneMonthAgo = moment().subtract(1, 'month');
        const oneYearAgo = moment().subtract(1, 'year');
        const oneDayAgo = moment().subtract(1, 'day');

        const usersLastWeek = await userModel.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const usersLastMonth = await userModel.countDocuments({ createdAt: { $gte: oneMonthAgo } });
        const usersLastYear = await userModel.countDocuments({ createdAt: { $gte: oneYearAgo } });
        const usersLastDay = await userModel.countDocuments({ createdAt: { $gte: oneDayAgo } });

        return res.status(HTTP.SUCCESS).json({
            status: true,
            code: HTTP.SUCCESS,
            lastWeek: usersLastWeek,
            lastMonth: usersLastMonth,
            lastYear: usersLastYear,
            lastDay: usersLastDay
        });


        // user ni details sathe 

        // const oneWeekAgo = moment().subtract(1, 'week');
        // const oneMonthAgo = moment().subtract(1, 'month');
        // const oneYearAgo = moment().subtract(1, 'year');
        // const oneDayAgo = moment().subtract(1, 'day');

        // const usersLastWeek = await userModel.find({ createdAt: { $gte: oneWeekAgo } }).select('-password -otp -role');
        // const usersLastMonth = await userModel.find({ createdAt: { $gte: oneMonthAgo } }).select('-password -otp -role');
        // const usersLastYear = await userModel.find({ createdAt: { $gte: oneYearAgo } }).select('-password -otp -role');
        // const usersLastDay = await userModel.find({ createdAt: { $gte: oneDayAgo } }).select('-password -otp -role');

        // return res.status(HTTP.SUCCESS).json({
        //     status: true,
        //     code: HTTP.SUCCESS,
        //     lastWeek: {
        //         count: usersLastWeek.length,
        //         data: usersLastWeek
        //     },
        //     lastMonth: {
        //         count: usersLastMonth.length,
        //         data: usersLastMonth
        //     },
        //     lastYear: {
        //         count: usersLastYear.length,
        //         data: usersLastYear
        //     },
        //     lastDay: {
        //         count: usersLastDay.length,
        //         data: usersLastDay
        //     }
        // });
    } catch (error) {
        console.error(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })

    }
}
module.exports = {
    login,
    getUpdateProfile,
    updateProfile,
    changePassword,
    showAllUser,
    showUser,
    deleteUser,
    updateUserStatus,
    forgotPassword,
    verifyOTP,
    updatePassword,
    getUsersCountByPeriod
}