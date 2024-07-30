const { keypair, decryptData } = require("./app/Models/keypair");

const getAllKeys = async ({ userId }) => {
  // Fetch encrypted data from DB1, DB2, and DB3
  const [data1, data2, data3] = await Promise.all([
    keypair.findOne({ userId, flag: "ichi" }, { _id: 0 }),
    keypair.findOne({ userId, flag: "ni" }, { _id: 0 }),
    keypair.findOne({ userId, flag: "san" }, { _id: 0 }),
  ]);
  // console.log("🚀 ~ getAllKeys ~ data1:", data1);
  // console.log("🚀 ~ getAllKeys ~ data2:", data2);
  // console.log("🚀 ~ getAllKeys ~ data3:", data3);

  if (!data1 || !data2 || !data3) return;

  const keyIchi = Buffer.from(process.env.keyHexIchi, "hex");
  const keyNi = Buffer.from(process.env.keyHexNi, "hex");
  const keySan = Buffer.from(process.env.keyHexSan, "hex");

  // Decrypt data from databases
  const decEvmP1 = decryptData(data1?.evmData?.encryptedData, data1?.evmData?.iv, keyIchi);
  const decEvmP2 = decryptData(data2?.evmData?.encryptedData, data2?.evmData?.iv, keyNi);
  const decEvmP3 = decryptData(data3?.evmData?.encryptedData, data3?.evmData?.iv, keySan);

  const decBtcP1 = decryptData(data1?.btcData?.encryptedData, data1?.btcData?.iv, keyIchi);
  const decBtcP2 = decryptData(data2?.btcData?.encryptedData, data2?.btcData?.iv, keyNi);
  const decBtcP3 = decryptData(data3?.btcData?.encryptedData, data3?.btcData?.iv, keySan);

  const decSolP1 = decryptData(data1?.solData?.encryptedData, data1?.solData?.iv, keyIchi);
  const decSolP2 = decryptData(data2?.solData?.encryptedData, data2?.solData?.iv, keyNi);
  const decSolP3 = decryptData(data3?.solData?.encryptedData, data3?.solData?.iv, keySan);

  // Parse decrypted data
  const parsedEvmP1 = JSON.parse(decEvmP1);
  const parsedEvmP2 = JSON.parse(decEvmP2);
  const parsedEvmP3 = JSON.parse(decEvmP3);

  const parsedBtcP1 = JSON.parse(decBtcP1);
  const parsedBtcP2 = JSON.parse(decBtcP2);
  const parsedBtcP3 = JSON.parse(decBtcP3);

  const parsedSolP1 = JSON.parse(decSolP1);
  const parsedSolP2 = JSON.parse(decSolP2);
  const parsedSolP3 = JSON.parse(decSolP3);

  return {
    hashedPrivateKey: parsedEvmP1.concat(parsedEvmP2, parsedEvmP3),
    solanaPK: parsedSolP1.concat(parsedSolP2, parsedSolP3).split(),
    btcPk: parsedBtcP1.concat(parsedBtcP2, parsedBtcP3),
  };
};

exports.getPoolImmutables = async (poolContract) => {
  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()]);

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

    const { hashedPrivateKey, solanaPK, btcPk } = await getAllKeys({ userId: user._id });

    return {
      id: user?._id,
      email: user?.email,
      wallet: user?.wallet,
      name: user?.name,
      hashedPrivateKey,
      solanaPK,
      solanawallet: user?.solanawallet,
      btcPk,
      btcAddress: user?.btcWallet,
      referralId: user?.referralId,
    };
  } catch (error) {
    console.error("Error fetching wallet information from the database:", error.message);
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

    const { hashedPrivateKey, solanaPK, btcPk } = await getAllKeys({ userId: user._id });

    return {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      wallet: user?.wallet,
      hashedPrivateKey,
      solanaPK,
      solanawallet: user?.solanawallet,
      btcPk,
      btcAddress: user?.btcWallet,
      referralId: user?.referralId,
    };
  } catch (error) {
    console.error("Error fetching wallet information from the database:", error.message);
    throw error;
  }
};
