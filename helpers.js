exports.getPoolImmutables = async (poolContract) => {
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  const immutables = {
    token0: token0,
    token1: token1,
    fee: fee,
  };
  return immutables;
};

exports.getPoolState = async (poolContract) => {
  const slot = poolContract.slot0();

  const state = {
    sqrtPriceX96: slot[0],
  };

  return state;
};

const userModel = require("./app/Models/userModel");

exports.getWalletInfo = async (chatId) => {
  console.log("Fetching wallet chatId information...");
  try {
    const user = await userModel.findOne({
      chatingId: {
        $elemMatch: {
          chatId: chatId,
          session: true,
        },
      },
    });
    if (!user) {
      return null;
    }
    return {
      id: user?._id,
      email: user?.email,
      wallet: user?.wallet,
      name: user?.name,
      hashedPrivateKey: user?.hashedPrivateKey,
      solanaPK: user?.solanaPK,
      solanawallet: user?.solanawallet,
      btcPk: user?.btcPK,
      btcAddress: user?.btcWallet,
      referralId: user?.referralId,
    };
  } catch (error) {
    console.error(
      "Error fetching wallet information from the database:",
      error.message
    );
    throw error;
  }
};
exports.getWalletInfoByEmail = async (email) => {
  console.log("Fetching wallet email information...");
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      throw new Error("user not found!!");
    }
    return {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      wallet: user?.wallet,
      hashedPrivateKey: user?.hashedPrivateKey,
      solanaPK: user?.solanaPK,
      solanawallet: user?.solanawallet,
      btcPk: user?.btcPK,
      btcAddress: user?.btcWallet,
    };
  } catch (error) {
    console.error(
      "Error fetching wallet information from the database:",
      error.message
    );
    throw error;
  }
};
