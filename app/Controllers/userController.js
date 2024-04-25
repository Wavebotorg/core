const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const axios = require('axios');
const userModel = require('../Models/userModel')
const txnModel = require('../Models/Txn.model')
const ethers = require('ethers');
const { ObjectId } = require('mongodb')
var randomstring = require("randomstring");
const HTTP = require('../../constants/responseCode.constant')
const { sendMail } = require('../../email/useremail');
const { pooladress } = require("../../swap")
const { swapToken } = require("../Controllers/uniswapTrader")
// SignUp New User Account

const signUp = async (req, res) => {
    console.log("=============================== Sign Up =============================", req.body);
    try {
        const { name, email, password, confirmPassword, chatId } = req.body
        console.log("🚀 ~ signUp ~ req.body:", req.body.chatId)
        if (!name || !email || !password || !confirmPassword) return res.status(HTTP.SUCCESS).send({ status: false, "code": HTTP.NOT_ALLOWED, "message": "All Fields Are Required" })
        if (!email.includes("@")) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid !", data: {} })
        const random_Number = randomstring.generate({ length: 4, charset: 'numeric' })
        const finduser = await userModel.findOne({ email: req.body.email })
        if (finduser) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "This Email Is Already Existing" })
        }
        if (req.body.password == req.body.confirmPassword) {
            const bpass = await bcrypt.hash(req.body.password, 10)
            const obj = new userModel({
                name: name,
                email: email,
                password: bpass,
                otp: random_Number,
                chatId: chatId
            })
            const data = {
                name: name,
                email: email,
                otp: random_Number,
                //templetpath: "./emailtemplets/otp_template.html"
            }
            sendMail(data)
            let saveData = await obj.save()
            //delete saveData._doc.otp
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Register Successfully", data: saveData })
        }
        else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Password doesn't match!" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// const login = async (req, res) => {
//     console.log("===================== Login =================")
//     try {
//         const { email, password } = req.body;
//         console.log(req.body)
//         if (!email || !password) return res.status(HTTP.SUCCESS).send({ status: false, "code": HTTP.NOT_ALLOWED, "msg": "All Fields Are Requried", data: {} })
//         if (!email.includes("@")) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Email is invalid !", data: {} })
//         const findUser = await userModel.findOne({ email: email })
//         if (!findUser) {
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.UNAUTHORIZED, "msg": "Email Is Not Existing" })
//         }
//         if (findUser.verify == false) {
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.UNAUTHORIZED, "msg": "You Are Not Verified" })
//         }
//         if (findUser.verify === true) {
//             bcrypt.compare(password, findUser.password, async (err, result) => {
//                 if (result === true) {
//                     const token = jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY)
//                     findUser.token = token;
//                     await findUser.save();
//                     return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully", token: token })
//                 } else {
//                     return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Valid Password" })
//                 }
//             })
//         } else {
//             return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Verify Your Email" })
//         }
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg })
//     }
// }



const login = async (req, res) => {
    console.log("===================== Login =================")
    try {
        const { email, password, chatId } = req.body;
        console.log("Request Body:", req.body);
        if (!email || !password) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, msg: "All Fields Are Required", data: {} });
        if (!email.includes("@")) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Email is invalid!", data: {} });

        const findUser = await userModel.findOne({ email: email });
        console.log("Find User:", findUser);
        if (!findUser) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "Email Does Not Exist" });
        }
        if (!findUser.verify) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "Account Not Verified" });
        }
        bcrypt.compare(password, findUser.password, async (err, result) => {
            if (result === true) {
                const token = jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY);
                const updatedChatId = chatId || null;
                console.log("Updated ChatId:", updatedChatId);
                if (!findUser.chatId) {
                    findUser.chatId = updatedChatId;
                    await findUser.save();
                }
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully", token: token });
            } else {
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid Password" });
            }
        });
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }
};

const verify = async (req, res) => {
    console.log("===================== Verify =================", req.body)
    try {
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email) return res.status(HTTP.SUCCESS).send({ status: false, "code": HTTP.NOT_ALLOWED, "msg": "Email Is Required", data: {} })
        if (!email.includes("@")) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Email is invalid !", data: {} })
        const findEmail = await userModel.findOne({ email: email })
        if (!findEmail) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "You Are Not Register" })
        }
        if (findEmail.otp == otp) {
            const Update = await userModel.findOneAndUpdate({ email: email }, { verify: true, otp: 0 }, { new: true })
            if (!Update) {
                return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong" })
            }
            const existingUser = await userModel.findOne({ email: email });
            if (!existingUser) {
                return res.status(HTTP.NOT_FOUND).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "User not found", data: {} });
            }
            const wallet = ethers.Wallet.createRandom();
            const walletAddress = wallet.address;
            const walletPrivateKey = wallet.privateKey;
            const updatedUser = await userModel.findOneAndUpdate(
                { email: req.body.email }, {
                $set: { wallet: walletAddress, hashedPrivateKey: walletPrivateKey }
            }
            );
            console.log("🚀 ~ verify ~ updatedUser:", updatedUser)
            if (!updatedUser) {
                return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "msg": "Could not save wallet", data: {} });
            }
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'Verify Successfully', data: req.body.types });
        } else {
            return res.status(HTTP.BAD_REQUEST).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid OTP. Please enter a valid OTP." })
        }
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg })
    }
}

const resendOTP = async (req, res) => {
    try {
        const finduser = await userModel.findOne({ email: req.body.email })
        const random_Number = randomstring.generate({ length: 4, charset: 'numeric' })
        if (req.body.types == "signup" && finduser.verify === true) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "User Is Already Verified", data: {} })
        }
        if (!finduser) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Unable To Find User!", data: {} })
        if (finduser.email) {
            const obj = new userModel({
                email: req.body.email,
                otp: random_Number

            })
            const data = {
                email: req.body.email,
                otp: random_Number,
                templetpath: "./emailtemplets/otp_template.html"
            }
            sendMail(data)
            await userModel.findOneAndUpdate({ email: req.body.email }, { otp: random_Number }, { new: true })
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Sent OTP Successfully" })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Unable to send OTP!", data: {} })
        }
    }
    catch (error) {
        console.log("🚀 ~ file: userController.js:108 ~ verify ~ error.msg:", error)
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg })
    }
}

const ForgetPassword = async (req, res) => {
    console.log("===================== Forget Password =================",)
    try {
        const finduser = await userModel.findOne({ email: req.body.email })
        const random_Number = randomstring.generate({ length: 4, charset: 'numeric' })
        if (!finduser) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Unable To Find User!", data: {} })
        if (finduser.email) {
            const obj = new userModel({
                email: req.body.email,
                otp: random_Number
            })
            const data = {
                email: req.body.email,
                otp: random_Number,
                templetpath: "./emailtemplets/otp_template.html"
            }
            sendMail(data)
            await userModel.findOneAndUpdate({ email: req.body.email }, { otp: random_Number }, { new: true })
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Sent OTP Successfully" })
        } else {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "msg": "Unable to send OTP!", data: {} })
        }
    }
    catch (error) {
        console.log("🚀 ~ file: userController.js:108 ~ verify ~ error.msg:", error)
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg })
    }
}

const resetPassword = async (req, res) => {
    console.log("=============================== reset password =============================")
    try {
        const findUser = await userModel.findOne({ email: req.body.email });
        if (req.body)
            if (findUser) {
                const password = req.body.newPassword;
                const confirmPassword = req.body.confirmPassword;
                if (password === confirmPassword) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await userModel.findOneAndUpdate({ email: req.body.email }, { password: hashedPassword }, { new: true });
                    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Password Is Reset" });
                } else {
                    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Password and confirmPassword Do Not Match" });
                }
            } else {
                return res.status(HTTP.NOT_FOUND).send({ status: false, code: HTTP.NOT_FOUND, msg: "User not found with the provided email" });
            }
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }
};


async function getData() {
    console.log("=============================== update watchlist with API data =============================");
    try {
        // Make a request to the CoinGecko API
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'USD',
                order: 'market_cap_desc',
                per_page: 250,
                page: 1,
                sparkline: false,
                locale: 'en',
            },
        });
        //console.log("🚀 ~ getData ~ response:", response)
        return response.data;
    } catch (error) {
        console.error('Error updating watchlist with API data:', error);
    }
}

const watchList = async (req, res) => {
    //console.log("=============================== watchList  =============================");
    try {
        const { coinId } = req.body;
        const AlreadyCoin = await userModel.findOne({ email: req.user.email, watchlist: coinId });
        if (AlreadyCoin) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "This Coin Is Alrady In Watchlist !", data: {} })
        }
        await userModel.findOneAndUpdate({ email: req.user.email }, { $push: { watchlist: coinId } }, { new: true });
        return res.json({ success: true, msg: 'Coin added to watchlist successfully' });
    } catch (error) {
        console.error("Error in watchList:", error);
        return res.status(500).json({ success: false, msg: 'Something went wrong', error: error.msg });
    }
};

//get user profile
async function getUserProfile(req, res) {
    try {
        let result = await userModel.findById(req.user.id)
        if (!result) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "Record not found", data: {} })
        //return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "msg": "User Profile", data: { email: result.email, name: result.name } });
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "msg": "User Profile", data: result });
    } catch (err) {
        console.log(err.msg)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "msg": "Something went wrong!", data: {} })
    }
}

// connect wallet

async function addWallet(req, res) {
    try {
        const existingUser = await userModel.findOne({ _id: req.user.id });
        console.log("🚀 ~ addWallet ~ existingUser:", existingUser)
        if (!existingUser) {
            return res.status(HTTP.NOT_FOUND).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "User not found", data: {} });
        }
        const wallet = ethers.Wallet.createRandom();
        const walletAddress = wallet.address;
        const walletPrivateKey = wallet.privateKey;
        const hashedPrivateKey = crypto.createHash('sha256').update(walletPrivateKey).digest('hex');
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: req.user.id },
            { wallet: walletAddress, hashedPrivateKey: walletPrivateKey },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(HTTP.NOT_FOUND).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "Could not save wallet", data: {} });
        }
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'Wallet added.', data: {} });
    } catch (error) {
        console.error(error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "msg": "Something went wrong!", data: {} });
    }
}

async function verifyPrivateKey(req, res) {
    try {
        const { privateKey } = req.body;
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(HTTP.NOT_FOUND).json({ status: false, code: HTTP.NOT_FOUND, msg: 'User not found' });
        }
        const decryptedPrivateKey = crypto.createHash('sha256').update(privateKey).digest('hex');
        if (decryptedPrivateKey === user.hashedPrivateKey) {
            return res.status(HTTP.SUCCESS).json({ status: true, code: HTTP.SUCCESS, msg: 'Private key verified successfully', decryptedPrivateKey });
        } else {
            return res.status(HTTP.UNAUTHORIZED).json({ status: false, code: HTTP.UNAUTHORIZED, msg: 'Incorrect private key' });
        }
    } catch (error) {
        console.error(error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: 'Something went wrong' });
    }
}

// Recent Join
async function recentUsers(req, res) {
    try {
        const newusers = await userModel.find({}).sort({ createdAt: -1 }).limit(10)
        let newuser = [];
        for (data of newusers) {
            newuser.push({ name: data.name, email: data.email, createdAt: data.createdAt })
        }
        if (!newusers) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "msg": "users not found!", data: {} })
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'recently joined users!.', data: newuser })

    } catch (error) {
        console.log("🚀 ~ recentUsers ~ error:", error)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "msg": "Something went wrong!", data: {} })
    }
}

// Get All WatchList
async function allWatchList(req, res) {
    //console.log("=============================== All WatchList  =============================");
    try {
        //let datas = await getData()
        const newusers = await userModel.findById(req.user._id);
        // let alldata = [];
        // for (d of datas) {
        //     for (j of newusers.watchlist) {
        //         if (d.id == j) {
        //             alldata.push(d)
        //         }
        //     }
        // }
        // const commonElements = datas.filter(element => newusers.watchlist.includes(element.id));
        // const filterdata = datas.filter((abc) => {
        //     if (abc)
        //         return newusers.watchlist.includes(abc.id)
        // })
        // console.log("🚀 ~ filterdata ~ filterdata:", filterdata)
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'All WatchList Data Show.', data: newusers.watchlist.reverse() });
    } catch (error) {
        console.log("🚀 ~ allWatchList ~ error:", error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "msg": "Something went wrong!", data: {} });
    }
}

const removeCoinWatchlist = async (req, res) => {
    try {
        console.log("==============================removeCoinWatchlist=============================");
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: req.user._id },
            { $pull: { watchlist: req.body.coinId } },
            { new: true }
        );
        if (updatedUser) {
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'Coin removed from Watchlist successfully.', data: updatedUser.watchlist });
        } else {
            return res.status(HTTP.NOT_FOUND).send({ 'status': false, 'code': HTTP.NOT_FOUND, 'msg': 'User not found or coin not in Watchlist.', data: {} });
        }
    } catch (error) {
        console.log("🚀 ~ removeCoinWatchlist ~ error:", error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ 'status': false, 'code': HTTP.INTERNAL_SERVER_ERROR, 'msg': 'Something went wrong!', data: {} });
    }
};


// Fatch Balance 
async function fetchBalance(wallet) {
    try {
        const address = wallet;
        const baseURL = "https://arb-mainnet.g.alchemy.com/v2/z2GyrrgTOYH4JlidpAs_2Cy-Gz1cHudl";
        const data = {
            jsonrpc: "2.0",
            method: "alchemy_getTokenBalances",
            headers: {
                "Content-Type": "application/json",
            },
            params: [`${address}`],
            id: 42,
        };
        const config = {
            method: "post",
            url: baseURL,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(data),
        };


        const response = await axios(config);
        const balances = response.data.result;
        const tokensData = [];
        const contractAddresses = balances.tokenBalances
            .filter((token) => token.tokenBalance !== 0)
            .map((token) => token.contractAddress);

        const metadataPromises = await contractAddresses.map(async (contractAddress) => {
            const options = {
                method: "POST",
                url: baseURL,
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                },
                data: {
                    id: 1,
                    jsonrpc: "2.0",
                    method: "alchemy_getTokenMetadata",
                    params: [contractAddress],
                },
            };
            return axios.request(options);
        });
        console.log("🚀 ~ metadataPromises ~ metadataPromises:", metadataPromises)

        const metadataResponses = await Promise.all(metadataPromises);

        metadataResponses.forEach((metadataResponse, index) => {
            const balance = balances?.tokenBalances[index]?.tokenBalance;
            if (typeof balance !== "undefined") {
                const metadata = metadataResponse.data;
                if (metadata?.result) {
                    const balanceValue = balance / Math.pow(10, metadata.result.decimals);
                    const formattedBalance = balanceValue.toFixed(5);
                    tokensData.push({
                        name: metadata.result.name,
                        logo: metadata.result.logo,
                        balance: `${formattedBalance}`,
                    });
                }
            }
        });
        console.log(tokensData);
        return tokensData
        // return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'msg': 'Show Balance', data: tokensData });
        // return tokensData;
    } catch (error) {
        console.error('Error fetching balance:', error);
        throw error; // Propagate the error
    }
}


// async function mainswap(token0, token1, amountIn, chainId, chatId) {
//     try {
//         console.log('token0', token0, 'token1', token1, amountIn)
//         const poolAddress = await pooladress(token0, token1 ,chainId)
//         console.log("🚀 ~ SwapToken ~ poolAddress:", poolAddress)
//         //   const getPoolImmutables = await getPoolImmutables(poolContract)
//         //   const getPoolState = await getPoolState(poolContract)
//         if (poolAddress) {
//             const executeSwap = await swapToken(token0, token1, poolAddress[0], amountIn ,chainId, chatId)
//             //console.log("-------------------------> mainswap", executeSwap.msg)
//             return executeSwap
//         }
//     } catch (error) {
//         console.log(error)
//         return error.reason

//     }
// }


const mainswap = async (req, res) => {
    let { token0, token1, amountIn, chainId, chatId } = req.body;
    amountIn = Number(amountIn)
    chainId = Number(chainId)
    try {
        const poolAddress = await pooladress(token0, token1, chainId)
        if (poolAddress) {
            const executeSwap = await swapToken(token0, token1, poolAddress[0], amountIn, chainId, chatId)
            //console.log("-------------------------> mainswap", executeSwap.msg)
            return executeSwap
        }
        return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.SUCCESS, 'msg': 'success', data: result });
    } catch (error) {
        console.log("🚀 ~  ~ error:", error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ 'status': false, 'code': HTTP.INTERNAL_SERVER_ERROR, 'msg': 'Something went wrong!', data: {} });
    }
};


module.exports = {
    signUp,
    login,
    verify,
    resendOTP,
    ForgetPassword,
    resetPassword,
    getUserProfile,
    watchList,
    allWatchList,
    removeCoinWatchlist,
    addWallet,
    verifyPrivateKey,
    recentUsers,
    fetchBalance,
    mainswap,
    //getWalletInfo,
} 