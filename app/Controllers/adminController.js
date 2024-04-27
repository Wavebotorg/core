const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
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
            role: "admin"
        }
        const checkEmail = await userModel.findOne({ email: admin.email })
        if (checkEmail) return;
        userModel({ name: admin.name, email: admin.email, password: admin.password, role: admin.role }).save()
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }

})();

// -------------------------------- Admin Login --------------------------------  

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const checkEmail = await userModel.findOne({ email: email, role: 'admin' })
        if (!checkEmail) return res.status(401).json({ msg: "Invalid Crendtials" });
        if (checkEmail.password === password) {
            const token = jwt.sign({ _id: checkEmail._id }, process.env.SECRET_KEY)
            if (!token) return res.status(401).json({ msg: "Something Went Wrong" });
            return res.status(200).json({ msg: "Success", token: token });
        }
        return res.status(401).json({ msg: "Invalid Crendtials" });

    } catch (error) {
        console.log(error);

        return res.status(500).json({ msg: "Internal Server Error" })
    }
}


// -------------------------------- Get Update Profile --------------------------------

const getUpdateProfile = async (req, res) => {
    try {
        const profile = await userModel.findById(req.user._id).select('-password -_id -role');
        if (!profile) return res.status(404).json({ msg: "User Not Found" })
        return res.status(200).json({ msg: profile })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }
}


// -------------------------------- update Profile --------------------------------

const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const profile = await userModel.findById(req.user._id).select('-password -_id -role');
        if (!profile) return res.status(404).json({ msg: "User Not Found" });

        let updatedProfile = profile;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;

        updatedProfile = await userModel.findByIdAndUpdate(req.user._id, updateFields, { new: true });
        return res.status(200).json({ msg: updatedProfile });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }
}


const changePassword = async (req, res) => {
    try {
        const { cuPass, newPass, coPass } = req.body;
        const user = await userModel.findById(req.user._id).select("password");

        if (!user) return res.status(404).json({ msg: "User Not Found" });

        if (cuPass !== user.password) return res.status(401).json({ msg: "Invalid Credential" });
        if (cuPass === newPass) return res.status(401).json({ msg: "Your Current Password and New Password Are the Same" });
        if (newPass !== coPass) return res.status(401).json({ msg: "New Password and Confirmation Password Do Not Match" });
        user.password = newPass;
        await user.save();

        return res.status(200).json({ msg: "Password updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }
}

const showAllUser = async (req, res) => {
    try {
        let userData = await userModel.aggregate([
            {
                $match: { role: "user" }
            },
            {
                $project: {
                    password: 0,
                    otp: 0,
                    role: 0
                }
            }
        ]);
        if (!userData || userData.length === 0) {
            return res.status(404).json({ msg: "No users found" });
        }

        return res.status(200).json({ msg: "Here are the users", data: userData });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }
}

// -------------------------------- Delete User By Admin --------------------------------  

const deleteUser = async (req, res) => {
    try {

        const { id } = req.params;
        const userData = await userModel.findById(id);
        console.log(userData);
        if (!userData) return res.status(404).json({ msg: "User Not Found" });

        await userModel.findByIdAndDelete(id);

        return res.status(200).json({ msg: "User deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
    }
}

// -------------------------------- Blocked Or UnBlocked User --------------------------------  

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(401).json({ msg: "Something Went Wrong" });
        const user = await userModel.findOne({ _id: userId });
        if (!user) return res.status(401).json({ msg: "User not found" });
        const newStatus = !user.isActive;
        const updateStatus = await userModel.findOneAndUpdate({ _id: userId }, { isActive: newStatus }, { new: true });
        if (!updateStatus) return res.status(401).json({ msg: "Task not Updated" });
        if (updateStatus) {
            const mailOptions = {
                from: 'test.project7312@gmail.com',
                to: updateStatus.email,
                subject: `Your are now ${newStatus ? 'Active' : 'DeActive'} by administrator`,
                // text: "Hello world?", // plain text body
                html: `<b>You Are ${newStatus ? 'Unblocked' : 'Blocked'}</b>`
            };

            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });
            return res.status(200).json({ msg: "User Status Updated Successfully", user: updateStatus })
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" })
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