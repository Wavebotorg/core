const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { default: Moralis } = require("moralis");
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
const { sendMail, welcomeSendMail } = require("../../email/useremail");
const { pooladress } = require("../../swap");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const { swapToken } = require("../Controllers/uniswapTrader");
const { decrypt } = require("mongoose-field-encryption");
const TxnEvm = require("../Models/TXNevmSwap");
const { createBTCWallet } = require("../../utils/createBitcoinWallet");
const { url } = require("inspector");
const { ChainNameById } = require("../kibaSwap/constant");

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
  console.log(
    "=============================== Sign Up =============================",
    req.body
  );
  try {
    const { name, email, password, confirmPassword, chatId, refferal } =
      req.body;
    if (!name || !email || !password || !confirmPassword)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_ALLOWED,
        message: "All Fields Are Required",
      });
    if (!email.includes("@"))
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Email is invalid !",
        data: {},
      });
    const random_Number = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    const finduser = await userModel.findOne({ email: req.body.email });
    if (finduser)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.INTERNAL_SERVER_ERROR,
        msg: "This Email Is Already Existing",
      });
    const findByUsername = await userModel.findOne({ name: name });
    if (findByUsername) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.INTERNAL_SERVER_ERROR,
        msg: "This username Is Already Existing",
      });
    }
    let refId = null;
    if (refferal) {
      const referralUser = await userModel.findOne({
        referralId: refferal,
      });
      if (!referralUser) {
        return res.status(200).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "refferal code is not valid!!",
        });
      }
      refId = referralUser?._id;
      console.log("🚀 ~ signUp ~ refId:", refId);
    }
    if (req.body.password == req.body.confirmPassword) {
      const bpass = await bcrypt.hash(req.body.password, 10);
      const obj = new userModel({
        name: name,
        email: email,
        password: bpass,
        otp: random_Number,
        chatId: {
          chat: chatId,
          sessionId: false,
        },
        referred: refferal ? refId : null,

        //createdAt: new Date().toLocaleDateString("en-GB"),
      });
      //const data = { name: name, email: email, otp: random_Number, templetpath: "./emailtemplets/otp_template.html" };
      const data = {
        name: name,
        email: email,
        otp: random_Number,
        //createdAt: obj.createdAt,
        templetpath: "./emailtemplets/templaet.html",
      };
      sendMail(data);
      let saveData = await obj.save();
      delete saveData._doc.otp;
      const token = jwt.sign({ _id: obj?._id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Register Successfully",
        data: saveData,
        token,
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Password doesn't match!",
      });
    }
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
};
const login = async (req, res) => {
  console.log("===================== Login =================");
  try {
    const { email, password, chatId } = req.body;
    console.log("Request Body:", req.body);
    if (!email || !password)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_ALLOWED,
        msg: "All Fields Are Required",
        data: {},
      });
    if (!email.includes("@"))
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Email is invalid!",
        data: {},
      });
    const findUser = await userModel.findOne({ email: email, isActive: true });
    if (!findUser)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.UNAUTHORIZED,
        msg: "Email Does Not Exist",
      });
    if (!findUser.verify)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.UNAUTHORIZED,
        msg: "Account Not Verified",
      });
    bcrypt.compare(password, findUser.password, async (err, result) => {
      if (result === true) {
        const token = jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY, {
          expiresIn: "1d",
        }); // Token expires in 30 days
        // if (chatId) {
        //   findUser.chatId = {
        //     chat: chatId,
        //     sessionId: true,
        //   };
        // }
        await findUser.save();
        if (chatId) {
          await userModel.updateMany(
            {
              chatingId: {
                $elemMatch: {
                  chatId: chatId,
                  session: true,
                },
              },
            },
            {
              $set: {
                "chatingId.$.session": false,
              },
            }
          );

          // Check if chatId already exists in chatingId array
          let chatExists = false;
          for (let i = 0; i < findUser?.chatingId?.length; i++) {
            if (findUser.chatingId[i].chatId === chatId) {
              chatExists = true;
              if (!findUser.chatingId[i].session) {
                findUser.chatingId[i].session = true;
                await userModel.updateOne(
                  { _id: findUser._id },
                  { $set: { chatingId: findUser.chatingId } }
                );
                console.log(
                  "🚀 ~ login ~ Session set to true for existing chatId"
                );
              }
              break;
            }
          }
          if (!chatExists) {
            if (findUser?.chatingId?.length >= 4) {
              const index = findUser.chatingId.findIndex(
                (obj) => obj.session === false
              );
              if (index !== -1) {
                findUser.chatingId.splice(index, 1);
              } else {
                findUser.chatingId.shift();
              }
            }
            findUser.chatingId.push({ chatId: chatId, session: true });
            await findUser.save();
          }
        }
        // Check if the token is expired
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.exp * 1000 < Date.now()) {
          return res.status(HTTP.SUCCESS).send({
            status: false,
            code: HTTP.UNAUTHORIZED,
            msg: "Please log in again!!",
          });
        }
        return res.status(HTTP.SUCCESS).send({
          status: true,
          code: HTTP.SUCCESS,
          msg: "Login Successfully",
          token: token,
          userId: findUser?._id,
          email: findUser?.email,
        });
      } else {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "Invalid Password",
        });
      }
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};

const verify = async (req, res) => {
  console.log("===================== Verify =================", req.body);
  try {
    const { email, chatId, otp } = req.body;
    const findUser =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    if (email) {
      if (!email.includes("@"))
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "Email is invalid !",
          data: {},
        });
    }
    const findEmail = await userModel.findOne({ email: findUser?.email });

    if (!findEmail)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "You Are Not Register",
      });

    if (findEmail.otp == otp) {
      const Update = await userModel.findOneAndUpdate(
        { email: findUser?.email },
        { verify: true, otp: 0 },
        { new: true }
      );

      if (!Update)
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
          status: false,
          code: HTTP.INTERNAL_SERVER_ERROR,
          msg: "Something Went Wrong",
        });

      const existingUser = await userModel.findOne({ email: findUser?.email });

      if (!existingUser)
        return res.status(HTTP.NOT_FOUND).send({
          status: false,
          code: HTTP.NOT_FOUND,
          msg: "User not found",
          data: {},
        });

      if (!existingUser?.referralId) {
        const wallet = await ethers.Wallet.createRandom();
        const walletAddress = wallet.address;
        const walletPrivateKey = wallet.privateKey;
        const { solanaAddress, solanaPrivateKey } = await generateWallet();
        const { BTCprivateKeyWIF, BTCprivateKeyHex, address } =
          await createBTCWallet();
        const updatedUser = await userModel.findOneAndUpdate(
          { email: findUser?.email },
          {
            $set: {
              wallet: walletAddress,
              hashedPrivateKey: walletPrivateKey,
              solanaPK: solanaPrivateKey,
              solanawallet: solanaAddress,
              btcWallet: address,
              btcPK: BTCprivateKeyHex,
              chatingId: {
                chatId: chatId ? chatId : null,
                session: chatId ? true : null,
              },
            },
          },
          {
            new: true,
          }
        );
        const data = {
          email: findEmail?.email,
          username: findEmail?.name,
          createdAt: findEmail?.createdAt,
          templetpath: "./emailtemplets/welcomemailtemp.html",
        };
        welcomeSendMail(data);
        if (!updatedUser)
          return res.status(HTTP.SUCCESS).send({
            status: false,
            code: HTTP.INTERNAL_SERVER_ERROR,
            msg: "Could not save wallet",
            data: {},
          });
        const ref1 = walletAddress?.slice(-4);
        const ref2 = findUser?.email?.substring(
          0,
          findUser?.email?.indexOf("@")
        );
        findEmail.referralId = ref1 + ref2?.slice(0, 4);
      }
      if (chatId) {
        // const user = await userModel.find({ chatId: chatId });
        await userModel.updateMany(
          { "chatId.chat": chatId },
          { $set: { "chatId.sessionId": false } }
        );
      }
      const updatedChatId = chatId || null;
      if (chatId) {
        findEmail.chatId = {
          chat: updatedChatId,
          sessionId: true,
        };
        await findEmail.save();
      }
      await findEmail.save();
      // generate token
      const token = jwt.sign({ _id: findEmail._id }, process.env.SECRET_KEY);
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Verification Successful. Welcome email sent.",
        data: req.body.types,
        userData: {
          name: findEmail?.name,
          email: findEmail?.email,
        },
        token: token,
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Invalid OTP. Please enter a valid OTP.",
      });
    }
  } catch (error) {
    console.log("🚀 ~ verify ~ error:", error?.message);
    return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};

const verifyUser = async (req, res) => {
  console.log("===================== Verify =================", req.body);
  try {
    const { email, chatId, otp } = req.body;
    const findUser =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    if (email) {
      if (!email.includes("@"))
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "Email is invalid !",
          data: {},
        });
    }
    const findEmail = await userModel.findOne({ email: findUser?.email });

    if (!findEmail)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "You Are Not Register",
      });

    if (findEmail.otp == otp) {
      const Update = await userModel.findOneAndUpdate(
        { email: findUser?.email },
        { verify: true, otp: 0 },
        { new: true }
      );

      if (!Update)
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
          status: false,
          code: HTTP.INTERNAL_SERVER_ERROR,
          msg: "Something Went Wrong",
        });

      const existingUser = await userModel.findOne({ email: findUser?.email });

      if (!existingUser)
        return res.status(HTTP.NOT_FOUND).send({
          status: false,
          code: HTTP.NOT_FOUND,
          msg: "User not found",
          data: {},
        });

      // generate token
      const token = jwt.sign({ _id: findEmail._id }, process.env.SECRET_KEY);
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Verification Successful. Welcome email sent.",
        data: req.body.types,
        userData: {
          name: findEmail?.name,
          email: findEmail?.email,
        },
        token: token,
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Invalid OTP. Please enter a valid OTP.",
      });
    }
  } catch (error) {
    console.log("🚀 ~ verify ~ error:", error?.message);
    return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const finduser = await userModel.findOne({ email: req.body.email });
    const random_Number = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    if (req.body.types == "signup" && finduser.verify === true) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "User Is Already Verified",
        data: {},
      });
    }
    if (!finduser)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Unable To Find User!",
        data: {},
      });
    if (finduser.email) {
      const obj = new userModel({ email: req.body.email, otp: random_Number });
      const data = {
        email: req.body.email,
        otp: random_Number,
        templetpath: "./emailtemplets/otp_template.html",
      };
      sendMail(data);
      await userModel.findOneAndUpdate(
        { email: req.body.email },
        { otp: random_Number },
        { new: true }
      );
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Sent OTP Successfully",
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Unable to send OTP!",
        data: {},
      });
    }
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};
const ForgetPassword = async (req, res) => {
  console.log("===================== Forget Password =================");
  try {
    const finduser = await userModel.findOne({ email: req.body.email });
    const random_Number = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    if (!finduser)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Unable To Find User!",
        data: {},
      });
    if (finduser.email) {
      const obj = new userModel({ email: req.body.email, otp: random_Number });
      const data = {
        email: req.body.email,
        otp: random_Number,
        templetpath: "./emailtemplets/otp_template.html",
      };
      sendMail(data);
      await userModel.findOneAndUpdate(
        { email: req.body.email },
        { otp: random_Number },
        { new: true }
      );
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Sent OTP Successfully",
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "Unable to send OTP!",
        data: {},
      });
    }
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};
const resetPassword = async (req, res) => {
  console.log(
    "=============================== reset password ============================="
  );
  try {
    const { password, confirmPassword, email, chatId } = req.body;
    const findUser =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    if (!password && !confirmPassword) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "All fields are required!!",
      });
    }
    if (findUser) {
      if (password === confirmPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.findOneAndUpdate(
          { email: findUser?.email },
          { password: hashedPassword },
          { new: true }
        );
        return res.status(HTTP.SUCCESS).send({
          status: true,
          code: HTTP.SUCCESS,
          msg: "Password reset successfully!!",
        });
      } else {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "Password and confirmPassword Does Not Match",
        });
      }
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        msg: "User not found with the provided email",
      });
    }
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.msg,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    console.log(
      "🚀 ~ changePassword ~ confirmNewPassword:",
      confirmNewPassword
    );
    console.log("🚀 ~ changePassword ~ newPassword:", newPassword);
    console.log("🚀 ~ changePassword ~ currentPassword:", currentPassword);
    const email = req?.user?.email;
    console.log("🚀 ~ changePassword ~ email:", email);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "All fields are required.",
      });
    }
    const findData = await userModel.findOne({ email: email });
    if (!findData) {
      return res
        .status(HTTP.SUCCESS)
        .send({ status: false, code: HTTP.NOT_FOUND, msg: "User not found." });
    }
    bcrypt.compare(currentPassword, findData.password, async (err, result) => {
      if (err) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
          status: false,
          code: HTTP.INTERNAL_SERVER_ERROR,
          msg: "Something went wrong.",
          error: err.message,
        });
      }
      if (result) {
        if (newPassword === confirmNewPassword) {
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          await userModel.findOneAndUpdate(
            { _id: findData._id },
            { password: hashedPassword }
          );
          return res.status(HTTP.SUCCESS).send({
            status: true,
            code: HTTP.SUCCESS,
            msg: "Password changed successfully.",
          });
        } else {
          return res.status(HTTP.SUCCESS).send({
            status: false,
            code: HTTP.BAD_REQUEST,
            msg: "New password and confirm password do not match.",
          });
        }
      } else {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          msg: "Current password is incorrect.",
        });
      }
    });
  } catch (error) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong.",
      error: error.message,
    });
  }
};

async function getData() {
  console.log(
    "=============================== update watchlist with API data ============================="
  );
  try {
    // Make a request to the CoinGecko API
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "USD",
          order: "market_cap_desc",
          per_page: 250,
          page: 1,
          sparkline: false,
          locale: "en",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating watchlist with API data:", error);
  }
}
const watchList = async (req, res) => {
  console.log(
    "=============================== watchList  ============================="
  );
  try {
    const { coinId } = req.body;
    const AlreadyCoin = await userModel.findOne({
      email: req.user.email,
      watchlist: coinId,
    });
    if (AlreadyCoin) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        msg: "This Coin Is Alrady In Watchlist !",
        data: {},
      });
    }
    await userModel.findOneAndUpdate(
      { email: req.user.email },
      { $push: { watchlist: coinId } },
      { new: true }
    );
    return res.json({
      success: true,
      msg: "Coin added to watchlist successfully",
    });
  } catch (error) {
    console.error("Error in watchList:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Something went wrong", error: error.msg });
  }
};
//get user profile
async function getUserProfile(req, res) {
  try {
    let result = await userModel
      .findById(req.user.id)
      .populate({
        path: "referred",
        select: "name",
      })
      .select("-solanaPK -hashedPrivateKey");
    if (!result)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        msg: "Record not found",
        data: {},
      });
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "User Profile",
      data: result,
    });
  } catch (err) {
    console.log(err.msg);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong!",
      data: {},
    });
  }
}
// Recent Join
async function recentUsers(req, res) {
  try {
    const newusers = await userModel
      .find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(10);
    let newuser = [];
    for (data of newusers) {
      newuser.push({
        name: data.name,
        email: data.email,
        createdAt: data.createdAt,
      });
    }
    if (!newusers)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        msg: "users not found!",
        data: {},
      });
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "recently joined users!.",
      data: newuser,
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong!",
      data: {},
    });
  }
}
// Get All WatchList
async function allWatchList(req, res) {
  console.log(
    "=============================== All WatchList  ============================="
  );
  try {
    const newusers = await userModel.findById(req.user._id);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "All WatchList Data Show.",
      data: newusers.watchlist.reverse(),
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong!",
      data: {},
    });
  }
}
const removeCoinWatchlist = async (req, res) => {
  try {
    console.log(
      "==============================removeCoinWatchlist============================="
    );
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { watchlist: req.body.coinId } },
      { new: true }
    );
    if (updatedUser)
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Coin removed from Watchlist successfully.",
        data: updatedUser.watchlist,
      });
    else
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        msg: "User not found or coin not in Watchlist.",
        data: {},
      });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong!",
      data: {},
    });
  }
};

// fetch balance

const fetchBalance = async (req, res) => {
  try {
    if (req.body.chatId) {
      const { chatId, chainId, email,network } = req.body;
      console.log("🚀 ~ fetchBalance ~ chainId:", chainId)
      const userfind =
        (chatId && (await getWalletInfo(chatId))) ||
        (email && (await getWalletInfoByEmail(email)));

      if (!Moralis.Core.isStarted) {
        await Moralis.start({
          apiKey: process.env.PUBLIC_MORALIS_API_KEY,
        });
      }
      const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice(
        {
          chain: chainId,
          address: userfind.wallet,
        }
      );
      
      const tokens = response?.raw()?.result?.filter(
        (item) => item?.usd_price != null
      );
      const map = new Map();
      tokens?.forEach((item) => map.set(item?.token_address, item));

      // find all tokens price
      let allTokenPrice = await Promise.all(
        tokens?.map(async (item) => {
          try {
            const tokenPriceResponse = await axios({
              url: `https://public-api.dextools.io/standard/v2/token/${network}/${item?.token_address}/price`,
              method: "get",
              headers: {
                accept: "application/json",
                "x-api-key": process.env.DEXTOOLAPIKEY,
              },
            });
            
            const info = await axios({
              url: `https://public-api.dextools.io/standard/v2/token/${network}/${item?.token_address}/info`,
              method: "get",
              headers: {
                accept: "application/json",
                "x-api-key": process.env.DEXTOOLAPIKEY,
              },
            });
            const tokenBalance = map.get(item?.token_address);
            return {
              ...tokenBalance,
              ...tokenPriceResponse?.data?.data,
              ...info?.data?.data,
            };
          } catch (error) {
            console.error(
              `Error fetching price for token ${item?.token_address}:`,
              error?.message
            );
          }
        })
      );

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.OK,
        message: "Here is token",
        data: allTokenPrice,
      });
    } else if (req.body.email) {
      const { email, chainId } = req.body;
      console.log("🚀 ~ fetchBalance ~ email:", email);
      const userfind = await userModel.findOne({ email: email });

      if (!Moralis.Core.isStarted) {
        await Moralis.start({
          apiKey: process.env.PUBLIC_MORALIS_API_KEY,
        });
      }
      const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice(
        {
          chain: chainId,
          address: userfind.wallet,
        }
      );
      const tokens = response?.response?.result;
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.OK,
        message: "Here is token",
        data: tokens.slice(0, 5),
      });
    }
  } catch (error) {
    console.log("🚀 ~ appGetTokenPrices ~ error:", error);
    // res.status(500).json({ error: 'Error fetching token prices' });
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      message: "Something went wrong!",
      data: {},
    });
  }
};

//  get indivudual Evm token price
async function getSingleTokenPrice(req, res) {
  try {
    const { chain, address, nativeToken, chatId } = req.body;
    console.log("🚀 ~ getSingleTokenPrice ~ nativeToken:", nativeToken);
    const userfind = await getWalletInfo(chatId);
    console.log("🚀 ~ getSingleTokenPrice ~ userfind:", userfind);
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain,
      include: "percent_change",
      address,
    });
    const response2 = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain,
      address: userfind?.wallet,
    });
    const rawResponse = response2?.raw();
    const nativeTokenDetails = await rawResponse?.result.filter(
      (item) => item?.token_address == nativeToken?.toLowerCase()
    );
    console.log(
      "🚀 ~ getSingleTokenPrice ~ nativeTokenDetails:",
      nativeTokenDetails
    );
    if (!response) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "token is not supported!!",
        data: {},
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "token details fetched!!",
      data: response,
      nativeToken: nativeTokenDetails,
    });
  } catch (error) {
    console.log("🚀 ~ getSingleTokenPrice ~ error:", error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "somthing has been wrong!!",
      data: {},
    });
  }
}
// get single solana token price
async function getSolanaSingleTokenPrice(req, res) {
  try {
    const { address } = req.body;
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const tokenPrice = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address,
    });
    console.log("🚀 ~ getSolanaSingleTokenPrice ~ tokenPrice:", tokenPrice);

    const tokenMetaData = await axios({
      url: `https://solana-gateway.moralis.io/token/mainnet/${address}/metadata`,
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.PUBLIC_MORALIS_API_KEY,
      },
    });
    if (!(tokenPrice && tokenMetaData)) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "token is not supported!!",
        data: {},
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "token details fetched!!",
      data: {
        address: tokenMetaData?.data?.mint,
        name: tokenMetaData?.data?.name,
        price: tokenPrice?.jsonResponse?.usdPrice,
      },
    });
  } catch (error) {
    console.log("🚀 ~ getSingleTokenPrice ~ error:", error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "somthing has been wrong!!",
      data: {},
    });
  }
}
const mainswap = async (req, res) => {
  let { token0, token1, amountIn, chainId, chatId, network, email } = req.body;
  if (!token0 || !token1 || !chainId) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.NOT_ALLOWED,
      message: "All Fields Are Required",
    });
  } else if (!amountIn) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.NOT_ALLOWED,
      message: "invalid token or amount!!",
    });
  }
  amountIn = Number(amountIn);
  chainId = Number(chainId);
  let url;
  switch (chainId) {
    case 1:
      url = "https://etherscan.io/tx/";
      break;
    case 42161:
      url = "https://arbiscan.io/tx/";
      break;
    case 10:
      url = "https://arbiscan.io/tx/";
      break;
    case 137:
      url = "https://polygonscan.com/tx/";
      break;
    case 8453:
      url = "https://basescan.org/tx/";
      break;
    case 56:
      url = "https://bscscan.com/tx/";
      break;
    case 43114:
      url = "https://avascan.info/blockchain/dfk/tx/";
      break;
    case 42220:
      url = "https://celoscan.io/tx/";
      break;
    case 238:
      url = "https://blastscan.io/tx/";
      break;
    default:
      break;
  }
  try {
    const userData =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    console.log("🚀 ~ mainswap ~ userData:", userData);
    const poolAddress = await pooladress(token0, token1, chainId);
    if (poolAddress) {
      const executeSwapHash = await swapToken(
        token0,
        token1,
        poolAddress[0],
        amountIn,
        chainId,
        userData.wallet,
        userData.hashedPrivateKey
      );
      const executeSwap = url + executeSwapHash;
      if (executeSwap != null) {
        await TxnEvm.create({
          userId: userData?.id,
          txid: executeSwap,
          amount: amountIn,
          from: token0,
          to: token1,
          chainId: chainId,
          network: network,
        });
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
// ----------------------------------- start bot API ----------------------------------
async function startBot(req, res) {
  const { chatId } = req.body;
  console.log("🚀 ~ startBot ~ chatId:", chatId);
  const isLogin = await userModel
    .findOne({
      chatingId: {
        chatId,
        session: true,
      },
    })
    .select("referralId name email wallet");
  if (!isLogin) {
    return res.status(HTTP.BAD_REQUEST).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      msg: "please login!",
      data: {},
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "already loggin!!",
    isLogin,
  });
}
// -------------------------------------------------- logout ------------------------------------
async function logoutBotUser(req, res) {
  console.log(
    "------------------------- logout called -------------------------"
  );
  const { chatId } = req.body;
  console.log("🚀 ~ logoutBotUser ~ chatId:", chatId);
  const userLogout = await userModel.findOneAndUpdate(
    {
      chatingId: {
        $elemMatch: {
          chatId: chatId,
          session: true,
        },
      },
    },
    {
      $set: {
        "chatingId.$.session": false,
      },
    },
    { new: true }
  );
  console.log("🚀 ~ logoutBotUser ~ userLogout:", userLogout?.name);
  // userLogout.chatId = {
  //   chat: chatId,
  //   sessionId: false,
  // };
  // const userLogged = await userLogout.save();
  if (!userLogout) {
    return res.status(HTTP.BAD_REQUEST).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      msg: "network error!!",
      data: {},
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "logout successfull!!",
    data: {},
  });
}

// -------------------------------- send otp ---------------------------------
async function sendOtp(req, res) {
  try {
    const { chatId, email } = req.body;
    const findUser =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    const user = await userModel.findOne({ email: findUser?.email });
    if (!user) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        msg: "user not found!!",
        data: {},
      });
    }
    const random_Number = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    console.log("🚀 ~ sendOtp ~ random_Number:", random_Number);
    user.otp = random_Number;
    await user.save();
    const data = {
      name: user?.name,
      email: user?.email,
      otp: random_Number,
      createdAt: user?.createdAt,
      templetpath: "./emailtemplets/templaet.html",
    };
    await sendMail(data);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "OTP sent successfully!!",
      data: {},
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      msg: error.message,
      data: {},
    });
  }
}

async function getUserReferals(req, res) {
  try {
    const user = req.user?._id;
    console.log("🚀 ~ getUserReferals ~ user:", user);
    const dataRef = await userModel
      .find({ referred: user })
      .select("name email");
    console.log("🚀 ~ getUserReferals ~ data:", dataRef);
    if (!dataRef) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.INTERNAL_SERVER_ERROR,
        msg: "no referral found!!",
        data: {},
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "referral fetched!!",
      dataRef,
    });
  } catch (error) {
    console.log("🚀 ~ getUserReferals ~ error:", error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "something has been wrong!!",
      data: {},
    });
  }
}

// function levels of refferals

async function refferalsLevel(data) {
  let users = [];
  for (let index = 0; index < data.length; index++) {
    let user = await userModel
      .find({ referred: data[index]?._id })
      .populate({
        path: "referred",
        select: "name email",
      })
      .select("name email referred createdAt");
    users = [...users, ...user];
  }
  return users;
}
async function getReferrals(req, res) {
  try {
    const { email } = req.body;
    console.log("🚀 ~ getReferrals ~ email:", email);

    const referrals = await userModel.aggregate([
      {
        $match: { email: email },
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "referred",
          as: "referrals",
          maxDepth: 5,
          depthField: "level",
        },
      },
      {
        $unwind: "$referrals",
      },
      {
        $lookup: {
          from: "users",
          localField: "referrals._id",
          foreignField: "referred",
          as: "userReferrals",
        },
      },
      {
        $addFields: {
          "referrals.referralCount": { $size: "$userReferrals" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "referrals.referred",
          foreignField: "_id",
          as: "referredUser",
        },
      },
      {
        $unwind: "$referredUser",
      },
      {
        $group: {
          _id: "$referrals.level",
          users: {
            $push: {
              name: "$referrals.name",
              email: "$referrals.email",
              referred: "$referredUser.name",
              createdAt: "$referrals.createdAt",
              referralCount: "$referrals.referralCount",
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by level
      },
    ]);

    let levels = {};
    referrals.forEach((level) => {
      levels[`level${level._id + 1}`] = level.users;
    });

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "Referral fetched!!",
      data: levels,
    });
  } catch (error) {
    console.log("🚀 ~ getReferrals ~ error:", error);
    return res.status(HTTP.INTERNAL_SERVER_ERROR).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something went wrong!!",
    });
  }
}

async function meet(req, res) {
  const { chatId, email } = req.body;
  if (chatId) {
    const msg = await getWalletInfo(chatId);
    res.send(msg);
  } else if (email) {
    const msg = await getWalletInfoByEmail(email);
    res.send(msg);
  }
}

async function leaderboard(req, res) {
  try {
    const leaderboard = await userModel.aggregate([
      {
        $group: {
          _id: "$referred",
          referrals: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
      {
        $sort: {
          referrals: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 1,
          referrals: 1,
          name: "$userDetails.name",
          email: "$userDetails.email",
        },
      },
    ]);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "referral fetched!!",
      leaderboard,
    });
  } catch (error) {
    console.log("🚀 ~ leaderboard ~ error:", error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "somthing has been wrong!!",
    });
  }
}

async function transactionBoard(req, res) {
  const userTransactionCount = await TxnEvm.aggregate([
    {
      $group: {
        _id: "$userId",
        totalTransaction: { $sum: 1 },
        totalTransferToken: { $sum: "$amount" },
      },
    },
    {
      $unionWith: {
        coll: "transfers",
        pipeline: [
          {
            $group: {
              _id: "$userId",
              totalTransaction: { $sum: 1 },
              totalTransferToken: { $sum: "$amount" },
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$_id",
        totalTransaction: { $sum: "$totalTransaction" },
        totalTransferToken: { $sum: "$totalTransferToken" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 1,
        name: "$userDetails.name",
        email: "$userDetails.email",
        totalTransaction: 1,
        totalTransferToken: 1,
      },
    },
    {
      $sort: { totalTransferToken: -1 },
    },
  ]);
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "transaction leaderboard!!",
    userTransactionCount,
  });
}

async function checkReferral(req, res) {
  const { referral } = req.body;
  console.log("🚀 ~ checkReferral ~ referral:", referral);

  const user = await userModel.findOne({
    referralId: referral,
  });
  console.log("🚀 ~ checkReferral ~ user:", user);

  if (!user) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      msg: "invalid referralId!!",
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "valid referralId!!",
    name: user?.name,
  });
}
module.exports = {
  transactionBoard,
  leaderboard,
  meet,
  getReferrals,
  getUserReferals,
  logoutBotUser,
  startBot,
  signUp,
  login,
  verify,
  verifyUser,
  resendOTP,
  sendOtp,
  ForgetPassword,
  checkReferral,
  resetPassword,
  getUserProfile,
  watchList,
  allWatchList,
  getSingleTokenPrice,
  removeCoinWatchlist,
  recentUsers,
  fetchBalance,
  getSolanaSingleTokenPrice,
  mainswap,
  changePassword,
  //getWalletInfo,
};
