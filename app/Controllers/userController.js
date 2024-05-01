const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const userModel = require("../Models/userModel");
const ethers = require("ethers");
// import bs58 from "bs58";
// import { Keypair } from "@solana/web3.js";
const { Keypair } = require("@solana/web3.js");
const bs58 = require("bs58");
const { ObjectId } = require("mongodb");
var randomstring = require("randomstring");
const HTTP = require("../../constants/responseCode.constant");
const { sendMail } = require("../../email/useremail");
const { pooladress } = require("../../swap");
const { getWalletInfo } = require("../../helpers");
const { swapToken } = require("../Controllers/uniswapTrader");
const { decrypt } = require("mongoose-field-encryption");

// ========================================= generate solana wallet===============================
const generateWallet = () => {
    // Step 1: Generate a new Solana keypair
    const keypair = Keypair.generate();

    // Step 2: Extract Solana private and public keys
    const solanaPrivateKey = keypair.secretKey.toString();

    //   const solanaPrivateKey = Buffer.from(solanaPrivateKeyLong).toString("hex");
    const solanaPublicKey = keypair.publicKey.toString();
    const solanaAddress = keypair.publicKey.toBase58();
    return { solanaAddress, solanaPrivateKey, solanaPublicKey };
};
// SignUp New User Account

const signUp = async (req, res) => {
    console.log("=============================== Sign Up =============================", req.body);
    try {
        const { name, email, password, confirmPassword, chatId } = req.body;
        console.log("🚀 ~ signUp ~ req.body:", req.body.chatId);
        if (!name || !email || !password || !confirmPassword)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "All Fields Are Required" });
        if (!email.includes("@"))
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Email is invalid !", data: {} });
        const random_Number = randomstring.generate({ length: 4, charset: "numeric" });
        const finduser = await userModel.findOne({ email: req.body.email });
        if (finduser)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "This Email Is Already Existing" });
        if (req.body.password == req.body.confirmPassword) {
            const bpass = await bcrypt.hash(req.body.password, 10);
            const obj = new userModel({ name: name, email: email, password: bpass, otp: random_Number, chatId: chatId });
            const data = { name: name, email: email, otp: random_Number, /*templetpath: "./emailtemplets/otp_template.html"*/ };
            sendMail(data);
            let saveData = await obj.save();
            //delete saveData._doc.otp
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Register Successfully", data: saveData });
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Password doesn't match!" });
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
};

const login = async (req, res) => {
    console.log("===================== Login =================");
    try {
        const { email, password, chatId } = req.body;
        console.log("Request Body:", req.body);
        if (!email || !password)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, msg: "All Fields Are Required", data: {} });
        if (!email.includes("@"))
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Email is invalid!", data: {} });

        const findUser = await userModel.findOne({ email: email, isActive: true });
        console.log("Find User:", findUser);
        if (!findUser)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "Email Does Not Exist" });
        if (!findUser.verify)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "Account Not Verified" });

        bcrypt.compare(password, findUser.password, async (err, result) => {
            if (result === true) {
                const token = jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY);
                const updatedChatId = chatId || null;
                console.log("Updated ChatId:", updatedChatId);
                if (!findUser.chatId) {
                    findUser.chatId = updatedChatId;
                    await findUser.save();
                }

                if (chatId) {
                    const newUser = findUser.chatingId.find((ele) => ele.chatId == chatId)
                    if (!newUser) {
                        findUser.chatingId.push({ chatId: chatId, session: true })

                        findUser.chatingId.forEach((user) => {
                            if (user.chatId !== chatId) {
                                user.session = false;
                            }
                        });
                        await findUser.save();
                    }
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
    console.log("===================== Verify =================", req.body);
    try {
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, msg: "Email Is Required", data: {} });
        if (!email.includes("@"))
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Email is invalid !", data: {} });
        const findEmail = await userModel.findOne({ email: email });
        if (!findEmail)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "You Are Not Register" });
        if (findEmail.otp == otp) {
            const Update = await userModel.findOneAndUpdate({ email: email }, { verify: true, otp: 0 }, { new: true });
            if (!Update)
                return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong" });
            const existingUser = await userModel.findOne({ email: email });
            if (!existingUser)
                return res.status(HTTP.NOT_FOUND).send({ status: false, code: HTTP.NOT_FOUND, msg: "User not found", data: {} });

            const wallet = ethers.Wallet.createRandom();
            const walletAddress = wallet.address;
            const walletPrivateKey = wallet.privateKey;
            const { solanaAddress, solanaPrivateKey, solanaPublicKey } = generateWallet();

            const updatedUser = await userModel.findOneAndUpdate({ email: req.body.email }, {
                $set: {
                    wallet: walletAddress,
                    hashedPrivateKey: walletPrivateKey,
                    solanaPK: solanaPrivateKey,
                    solanawallet: solanaAddress,
                },
            }, {
                new: true,
            });
            console.log("🚀 ~ verify ~ updatedUser:", updatedUser);
            if (!updatedUser)
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Could not save wallet", data: {} });

            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Verify Successfully", data: req.body.types });
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid OTP. Please enter a valid OTP." });
        }
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }
};


const resendOTP = async (req, res) => {
    try {
        const finduser = await userModel.findOne({ email: req.body.email });
        const random_Number = randomstring.generate({ length: 4, charset: "numeric" });

        if (req.body.types == "signup" && finduser.verify === true) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "User Is Already Verified", data: {} });
        }

        if (!finduser)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Unable To Find User!", data: {} });

        if (finduser.email) {
            const obj = new userModel({ email: req.body.email, otp: random_Number });
            const data = { email: req.body.email, otp: random_Number, templetpath: "./emailtemplets/otp_template.html" };
            sendMail(data);
            await userModel.findOneAndUpdate({ email: req.body.email }, { otp: random_Number }, { new: true });
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Sent OTP Successfully" });
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Unable to send OTP!", data: {} });
        }
    } catch (error) {
        console.log("🚀 ~ file: userController.js:108 ~ verify ~ error.msg:", error);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }
};

const ForgetPassword = async (req, res) => {
    console.log("===================== Forget Password =================");
    try {
        const finduser = await userModel.findOne({ email: req.body.email });
        const random_Number = randomstring.generate({ length: 4, charset: "numeric" });

        if (!finduser)
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Unable To Find User!", data: {} });

        if (finduser.email) {
            const obj = new userModel({ email: req.body.email, otp: random_Number });
            const data = { email: req.body.email, otp: random_Number, templetpath: "./emailtemplets/otp_template.html" };
            sendMail(data);
            await userModel.findOneAndUpdate({ email: req.body.email }, { otp: random_Number }, { new: true });
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Sent OTP Successfully" });
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Unable to send OTP!", data: {} });
        }
    } catch (error) {
        console.log("🚀 ~ file: userController.js:108 ~ verify ~ error.msg:", error);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }

};

const resetPassword = async (req, res) => {
    console.log("=============================== reset password =============================");
    try {
        const findUser = await userModel.findOne({ email: req.body.email });
        if (req.body) {
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
        }
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg });
    }
};

async function getData() {
    console.log("=============================== update watchlist with API data =============================");
    try {
        // Make a request to the CoinGecko API
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "USD",
                order: "market_cap_desc",
                per_page: 250,
                page: 1,
                sparkline: false,
                locale: "en",
            },
        });
        //console.log("🚀 ~ getData ~ response:", response)
        return response.data;
    } catch (error) {
        console.error("Error updating watchlist with API data:", error);
    }

}

const watchList = async (req, res) => {
    console.log("=============================== watchList  =============================");
    try {
        const { coinId } = req.body;
        const AlreadyCoin = await userModel.findOne({ email: req.user.email, watchlist: coinId });

        if (AlreadyCoin) {
            return res.status(HTTP.SUCCESS).send({
                status: false,
                code: HTTP.NOT_FOUND,
                msg: "This Coin Is Alrady In Watchlist !",
                data: {},
            });
        }

        await userModel.findOneAndUpdate({ email: req.user.email }, { $push: { watchlist: coinId } }, { new: true });

        return res.json({
            success: true,
            msg: "Coin added to watchlist successfully",
        });
    } catch (error) {
        console.error("Error in watchList:", error);
        return res.status(500).json({ success: false, msg: "Something went wrong", error: error.msg });
    }

};

//get user profile
async function getUserProfile(req, res) {
    try {
        let result = await userModel.findById(req.user.id);
        if (!result) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, msg: "Record not found", data: {} });
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "User Profile", data: result });
    } catch (err) {
        console.log(err.msg);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something went wrong!", data: {} });
    }
}

// Recent Join
async function recentUsers(req, res) {
    try {
        const newusers = await userModel.find({}).sort({ createdAt: -1 }).limit(10);
        let newuser = [];
        for (data of newusers) {
            newuser.push({ name: data.name, email: data.email, createdAt: data.createdAt });
        }
        if (!newusers) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, msg: "users not found!", data: {} });
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "recently joined users!.", data: newuser });
    } catch (error) {
        console.log("🚀 ~ recentUsers ~ error:", error);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something went wrong!", data: {} });
    }

}

// Get All WatchList
async function allWatchList(req, res) {
    console.log("=============================== All WatchList  =============================");
    try {
        const newusers = await userModel.findById(req.user._id);
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "All WatchList Data Show.", data: newusers.watchlist.reverse() });
    } catch (error) {
        console.log("🚀 ~ allWatchList ~ error:", error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something went wrong!", data: {} });
    }

}

const removeCoinWatchlist = async (req, res) => {
    try {
        console.log("==============================removeCoinWatchlist=============================");
        const updatedUser = await userModel.findOneAndUpdate({ _id: req.user._id }, { $pull: { watchlist: req.body.coinId } }, { new: true });
        if (updatedUser) return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Coin removed from Watchlist successfully.", data: updatedUser.watchlist });
        else return res.status(HTTP.NOT_FOUND).send({ status: false, code: HTTP.NOT_FOUND, msg: "User not found or coin not in Watchlist.", data: {} });
    } catch (error) {
        console.log("🚀 ~ removeCoinWatchlist ~ error:", error);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something went wrong!", data: {} });
    }

};


const fetchBalance = async (req, res) => {
    try {
        if (req.body.chatId) {
            const { chatId } = req.body;
            if (!chatId) {
                return res.status(400).json({ error: "Chat ID is required" });
            }
            const user = await userModel.findOne({ chatId: chatId });
            console.log("🚀 ~ fetchBalance ~ user:", user);
            if (!user || !user.wallet) {
                return res.status(404).json({ error: "User not found or wallet address not available" });
            }
            const wallet = user.wallet;
            const baseURL = "https://arb-mainnet.g.alchemy.com/v2/z2GyrrgTOYH4JlidpAs_2Cy-Gz1cHudl";
            const data = {
                jsonrpc: "2.0",
                method: "alchemy_getTokenBalances",
                headers: { "Content-Type": "application/json" },
                params: [`${wallet}`],
                id: 42
            };
            const config = {
                method: "post",
                url: baseURL,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(data)
            };
            const response = await axios(config);
            const balances = response.data.result;
            const contractAddresses = balances.tokenBalances
                .filter((token) => token.tokenBalance !== 0)
                .map((token) => token.contractAddress);
            const metadataPromises = contractAddresses.map(async (contractAddress) => {
                const options = {
                    method: "POST",
                    url: baseURL,
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json"
                    },
                    data: {
                        id: 1,
                        jsonrpc: "2.0",
                        method: "alchemy_getTokenMetadata",
                        params: [contractAddress]
                    }
                };
                return axios.request(options);
            });
            const metadataResponses = await Promise.all(metadataPromises);
            const tokensData = metadataResponses.map((metadataResponse, index) => {
                const balance = balances?.tokenBalances[index]?.tokenBalance;
                if (typeof balance !== "undefined") {
                    const metadata = metadataResponse.data;
                    if (metadata?.result) {
                        const balanceValue = balance / Math.pow(10, metadata.result.decimals);
                        const formattedBalance = balanceValue.toFixed(5);
                        return {
                            name: metadata.result.name,
                            logo: metadata.result.logo,
                            balance: `${formattedBalance}`
                        };
                    }
                }
                return null;
            }).filter(token => token !== null);
            res.status(200).json(tokensData);
        } else if (req.body.email) {
            const { email } = req.body; // Corrected from chatId to email
            if (!email) {
                return res.status(400).json({ error: "Email is required" }); // Corrected from Chat ID to Email
            }
            const user = await userModel.findOne({ email: email }); // Corrected from chatId to email
            console.log("🚀 ~ fetchBalance ~ user:", user);
            if (!user || !user.wallet) {
                return res.status(404).json({ error: "User not found or wallet address not available" });
            }
            const wallet = user.wallet;
            const baseURL = "https://arb-mainnet.g.alchemy.com/v2/z2GyrrgTOYH4JlidpAs_2Cy-Gz1cHudl";
            const data = {
                jsonrpc: "2.0",
                method: "alchemy_getTokenBalances",
                headers: { "Content-Type": "application/json" },
                params: [`${wallet}`],
                id: 42
            };
            const config = {
                method: "post",
                url: baseURL,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(data)
            };
            const response = await axios(config);
            const balances = response.data.result;
            const contractAddresses = balances.tokenBalances
                .filter((token) => token.tokenBalance !== 0)
                .map((token) => token.contractAddress);
            const metadataPromises = contractAddresses.map(async (contractAddress) => {
                const options = {
                    method: "POST",
                    url: baseURL,
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json"
                    },
                    data: {
                        id: 1,
                        jsonrpc: "2.0",
                        method: "alchemy_getTokenMetadata",
                        params: [contractAddress]
                    }
                };
                return axios.request(options);
            });
            const metadataResponses = await Promise.all(metadataPromises);
            const tokensData = metadataResponses.map((metadataResponse, index) => {
                const balance = balances?.tokenBalances[index]?.tokenBalance;
                if (typeof balance !== "undefined") {
                    const metadata = metadataResponse.data;
                    if (metadata?.result) {
                        const balanceValue = balance / Math.pow(10, metadata.result.decimals);
                        const formattedBalance = balanceValue.toFixed(5);
                        return {
                            name: metadata.result.name,
                            logo: metadata.result.logo,
                            balance: `${formattedBalance}`
                        };
                    }
                }
                return null;
            }).filter(token => token !== null);

            res.status(200).json(tokensData);
        }
    } catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



// const fetchBalance = async (req, res) => {
//     try {
//         const { chatId } = req.body;
//         if (!chatId) {
//             return res.status(400).json({ error: "Chat ID is required" });
//         }
//         const user = await userModel.findOne({ chatId: chatId });
//         console.log("🚀 ~ fetchBalance ~ user:", user)
//         if (!user || !user.wallet) {
//             return res.status(404).json({ error: "User not found or wallet address not available" });
//         }
//         const wallet = user.wallet;
//         const baseURL = "https://arb-mainnet.g.alchemy.com/v2/z2GyrrgTOYH4JlidpAs_2Cy-Gz1cHudl";
//         const data = {
//             jsonrpc: "2.0",
//             method: "alchemy_getTokenBalances",
//             headers: { "Content-Type": "application/json" },
//             params: [`${wallet}`],
//             id: 42
//         };
//         const config = {
//             method: "post",
//             url: baseURL,
//             headers: { "Content-Type": "application/json" },
//             data: JSON.stringify(data)
//         };
//         const response = await axios(config);
//         const balances = response.data.result;

//         const contractAddresses = balances.tokenBalances
//             .filter((token) => token.tokenBalance !== 0)
//             .map((token) => token.contractAddress);

//         const metadataPromises = contractAddresses.map(async (contractAddress) => {
//             const options = {
//                 method: "POST",
//                 url: baseURL,
//                 headers: {
//                     accept: "application/json",
//                     "content-type": "application/json"
//                 },
//                 data: {
//                     id: 1,
//                     jsonrpc: "2.0",
//                     method: "alchemy_getTokenMetadata",
//                     params: [contractAddress]
//                 }
//             };
//             return axios.request(options);
//         });

//         const metadataResponses = await Promise.all(metadataPromises);

//         const tokensData = metadataResponses.map((metadataResponse, index) => {
//             const balance = balances?.tokenBalances[index]?.tokenBalance;
//             if (typeof balance !== "undefined") {
//                 const metadata = metadataResponse.data;
//                 if (metadata?.result) {
//                     const balanceValue = balance / Math.pow(10, metadata.result.decimals);
//                     const formattedBalance = balanceValue.toFixed(5);
//                     return {
//                         name: metadata.result.name,
//                         logo: metadata.result.logo,
//                         balance: `${formattedBalance}`
//                     };
//                 }
//             }
//             return null;
//         }).filter(token => token !== null);

//         res.status(200).json(tokensData);
//     } catch (error) {
//         console.error("Error fetching balance:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };


const mainswap = async (req, res) => {
    let { token0, token1, amountIn, chainId, chatId } = req.body;
    amountIn = Number(amountIn);
    chainId = Number(chainId);
    try {
        const userData = await getWalletInfo(chatId);
        const poolAddress = await pooladress(token0, token1, chainId);
        if (poolAddress) {
            const executeSwap = await swapToken(token0, token1, poolAddress[0], amountIn, chainId, chatId, userData.hashedPrivateKey, userData.wallet);
            if (executeSwap != null) {
                return res.status(HTTP.SUCCESS).send({
                    status: true,
                    code: HTTP.SUCCESS,
                    msg: "Transaction successful!",
                    data: executeSwap,
                });
            } else {
                return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
                    status: false,
                    code: HTTP.INTERNAL_SERVER_ERROR,
                    msg: "Transaction failed!",
                    data: {},
                });
            }
        } else {
            return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
                status: false,
                code: HTTP.INTERNAL_SERVER_ERROR,
                msg: "Transaction failed!",
                data: {},
            });
        }
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
            status: false,
            code: HTTP.INTERNAL_SERVER_ERROR,
            msg: "Something went wrong!",
            data: {},
        });
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
    recentUsers,
    fetchBalance,
    mainswap,
    //getWalletInfo,
};
