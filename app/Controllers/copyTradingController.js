const userModel = require("../Models/userModel");
const HTTP = require("../../constants/responseCode.constant");

exports.becomeTrader = async (req, res) => {
  try {
    console.log("req.user._id", req.user._id);
    // todo: change user type to "trader"
    // ! check if they are copy trading s/o
    const user = await userModel.findOne(req.user._id);
    if (user.userType === "trader" || user.follow) {
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.BAD_REQUEST,
        msg: "You are either a trader or following someone",
      });
    }
    console.log("🚀 ~ exports.becomeTrader= ~ user:", user);
    await userModel.findOneAndUpdate(req.user._id, { userType: "trader" }, { new: true });

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "You are now a trader.",
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
};

exports.followTrader = async (req, res) => {
  console.log(req.user._id, "-------logged user--------");

  try {
    const { targetWallet, percentage } = req.body;

    // todo: already following s/o
    const user = await userModel.findById(req.user._id).select("follow");

    if (user.follow != null)
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.BAD_REQUEST,
        msg: "You are already following a Trader. You can only follow an account at a time.",
      });

    // todo: check wallet and get the ID if not->(Invalid Trader Wallet.)
    const target = await userModel.findOne({ $or: [{ solanawallet: targetWallet }, { wallet: targetWallet }] });

    if (target.userType === "trader") {
      console.log("🚀 ~ exports.followTrader= ~ user._id:", target._id);
      // todo: add the trader's ID to "follow" in userModel add percentage "active" copyTrade
      const userUpdate = await userModel.findByIdAndUpdate(
        req.user._id,
        {
          // userType
          copyTrade: "active",
          follow: target._id,
          percentage,
        },
        {
          new: true,
        }
      );

      // todo: this user cannot buy sell swap anymore

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "Followed successfully.",
      });
    } else {
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.BAD_REQUEST,
        msg: "Cannot CopyTrade this Wallet.",
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

exports.unfollowTrader = async (req, res) => {
  try {
    // update follow, percentage, copyTrade,userType(if changing to copytrade)
    const userUpdate = await userModel.findByIdAndUpdate(
      req.user._id,
      { follow: null, percentage: "", copyTrade: "" },
      { new: true }
    );

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: `Successfully Unfollowed.`,
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { traderId } = req.body;

    if (!traderId)
      // !wallet
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.NOT_FOUND,
        msg: "Trader ID is required.",
      });

    // todo: check if he is a trader
    const isTrader = await userModel.findOne({ $and: [{ _id: traderId }, { userType: "trader" }] });

    if (!isTrader)
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.NOT_FOUND,
        msg: "This user is NOT a trader.",
      });

    // const trader = await userModel.findOne({ $or: [{ solanawallet: wallet }, { wallet }] }, "_id");
    // const data = await userModel.find(
    //   { follow: trader._id, isActive: true, copyTrade: "active" },
    //   { _id: 1, name: 1, btcWallet: 1, solanawallet: 1, wallet: 1, percentage: 1 }
    // );

    const data = await userModel.find(
      { follow: traderId, isActive: true, copyTrade: "active" },
      { _id: 0, name: 1, email: 1 }
    );

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: `All of your Followers List`,
      data,
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
};

exports.listOfTraders = async (req, res) => {
  try {
    const data = await userModel.find({ userType: "trader" }, { _id: 1, name: 1 });

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: `List of the traders.`,
      data,
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
};
