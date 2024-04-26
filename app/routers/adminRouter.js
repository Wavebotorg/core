const express = require('express');
const router = express.Router();
const userModel = require("../Models/userModel");
const adminController = require("../Controllers/adminController")
const { authadmin } = require("../middlewares/authuser");


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

/* LOGIN */
router.post("/login", adminController.login)

/* GET UPDATE PROFILE */
router.get("/getUpdateProfile", authadmin, adminController.getUpdateProfile);

// /* UPDATE PROFILE */
router.post("/updateProfile", authadmin, adminController.updateProfile);

/* CHANGE PASSWORD */
router.post("/changePassword", authadmin, adminController.changePassword);

/* SHOW ALL USER */
router.get("/showAllUser", authadmin, adminController.showAllUser);

/* DELETE USER */
router.post("/deleteUser/:id", authadmin, adminController.deleteUser);

/* UPDATE USER STATUS */
router.get("/updateUserStatus/:userId", authadmin, adminController.updateUserStatus);


module.exports = router;
