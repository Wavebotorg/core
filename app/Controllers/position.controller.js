const positions = require("../Models/positions");
const HTTP = require("../../constants/responseCode.constant");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const { default: Moralis } = require("moralis");
async function positionsList(req, res) {
  try {
    const { chatId, chainId, email } = req.body;
    // find wallet details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    //   check user is exist or not
    if (!walletDetails) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "User not found!!",
      });
    }
    //  find position details from database
    let positionData = await positions.find({
      userId: walletDetails?.id,
      network: chainId,
    });
    console.log("🚀 ~ positionsList ~ positionData:", positionData);

    //  find balances by using token address
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
      chain: chainId,
      address: walletDetails?.wallet,
    });
    let balancesOfEvm = response?.raw()?.result;
    // console.log("🚀 ~ positionsList ~ balancesOfEvm:", balancesOfEvm);
    if (!balancesOfEvm) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "No balance found!!",
      });
    }
    // merged data
    const mergedData = [];

    // step 1
    const map = new Map();
    balancesOfEvm?.forEach((item) => map.set(item?.token_address, item));
    console.log("🚀 ~ positionsList ~ map:", map);
    const nativeToken = map.get("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    // step 2
    positionData?.forEach((item) => {
      const item2 = map.get(item.tokenAddress?.toLowerCase());
      if (item2) {
        const change = item2?.usd_price - item?.currentPrice;
        const percentageChange = (change / item?.currentPrice) * 100;
        mergedData.push({
          tokenAddress: item?.tokenAddress,
          qty: item2?.balance_formatted,
          value_in_usd: item2?.usd_value,
          price_at_invested: item?.currentPrice,
          symbol: item2?.symbol,
          percentage_of_growth: percentageChange.toFixed(5),
          currentPrice: item2?.usd_price,
          usd_price_24hr_percent_change: item2?.usd_price_24hr_percent_change,
          usd_price_24hr_usd_change: item2?.usd_price_24hr_usd_change,
          usd_value_24hr_usd_change: item2?.usd_value_24hr_usd_change,
          total_supply: item2?.total_supply_formatted,
          portfolio_percentage: item2?.portfolio_percentage,
        });
      }
    });
    console.log("🚀 ~ returnres.status ~ mergedData:", mergedData);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "Positions fetch!!",
      data: {
        nativeToken: nativeToken,
        tokensData: mergedData,
      },
    });
  } catch (error) {
    console.log("🚀 ~ positionsList ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      message: "Somthing went wrong!!",
    });
  }
}

module.exports = { positionsList };
