const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
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


// ============================== Default SignUp =================================
(async (req, res) => {
    try {
        const admin = {
            name: "Admin",
            email: "admin@gmail.com",
            password: "admin@123",
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
        if (checkEmail.password === password) {
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

        if (!user) return res.status(HTTP.SUCCESS).json({status:false,code:HTTP.NOT_FOUND, msg: "User Not Found" });

        if (cuPass !== user.password) return res.status(HTTP.SUCCESS).json({status:false,code:HTTP.UNAUTHORIZED, msg: "Invalid Credential" });
        if (cuPass === newPass) return res.status(HTTP.SUCCESS).json({status:false,code:HTTP.UNAUTHORIZED, msg: "Your Current Password and New Password Are the Same" });
        if (newPass !== coPass) return res.status(HTTP.SUCCESS).json({ status:false,code:HTTP.UNAUTHORIZED,msg: "New Password and Confirmation Password Do Not Match" });
        user.password = newPass;
        await user.save();

        return res.status(HTTP.SUCCESS).json({status: true, code: HTTP.SUCCESS, msg: "Password updated successfully" });

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
            return res.status(HTTP.SUCCESS).json({ status:false,code:HTTP.NOT_FOUND,msg: "No users found" });
        }

        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS,msg: "Here are the users", data: userData });
    }
    catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Delete User By Admin --------------------------------  

const deleteUser = async (req, res) => {
    try {

        const { id } = req.params;
        const userData = await userModel.findById(id);
        if (!userData) return res.status(HTTP.SUCCESS).json({ status:false,code:HTTP.NOT_FOUND,msg: "User Not Found" });
        await userModel.findByIdAndDelete(id);
        return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS,msg: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


// -------------------------------- Blocked Or UnBlocked User --------------------------------  

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(HTTP.SUCCESS).json({ status:false,code:HTTP.NOT_FOUND,msg: "Something Went Wrong" });

        const user = await userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { isActive: { $not: "$isActive" } } },
            { new: true }
        ).select("email isActive");

        if (!user) return res.status(HTTP.SUCCESS).json({ status:false,code:HTTP.NOT_FOUND,msg: "User not found" });

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

        res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS,msg: "User Status Updated Successfully", user });
    } catch (error) {
        console.log(error);
        return res.status(HTTP.SUCCESS).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Internal Server Error" })
    }
}


module.exports = {
    login,
    getUpdateProfile,
    updateProfile,
    changePassword,
    showAllUser,
    deleteUser,
    updateUserStatus
}