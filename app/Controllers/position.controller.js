const positions = require("../Models/positions");
const HTTP = require("../../constants/responseCode.constant");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const { default: Moralis } = require("moralis");
const { default: axios } = require("axios");
const { ChainNameById } = require("../kibaSwap/constant");

//  conver a number in human readable formate
function humanReadableFormat(number) {
  const units = ["", "Thousand", "Million", "Billion", "Trillion"];
  let unitIndex = 0;

  while (Math.abs(number) >= 1000 && unitIndex < units.length - 1) {
    number /= 1000;
    unitIndex++;
  }

  return `${number.toFixed(2)}$ ${units[unitIndex]}`;
}

//  add comas to the number
function addCommas(number) {
  const numberString = Number(number)?.toFixed()?.toString();

  const formattedString = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return formattedString;
}
// position for EVM
async function positionsListEvm(req, res) {
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
    // step 2
    positionData?.forEach(async (item) => {
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
          percentage_of_growth: percentageChange.toFixed(3),
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

// position for solana
async function positionsListForSolana(req, res) {
  try {
    const { chatId, email } = req.body;
    if (!chatId && !email) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fields are required!!",
      });
    }

    // find wallet details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    // find token from database
    const dataBaseTokens = await positions.find({
      network: 19999,
      userId: walletDetails?.id,
    });
    console.log(
      "🚀 ~ positionsListForSolana ~ dataBaseTokens:",
      dataBaseTokens
    );

    // find solana holdings from moralis
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }

    const response = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: walletDetails?.solanawallet,
    });

    if (!response) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "you do not have any holdings!!",
      });
    }
    // step 1 convert all token balances into map
    const map = new Map();
    response?.raw?.tokens?.forEach((item) => map.set(item?.mint, item));

    // find all tokens price
    let allTokenPrice = await Promise.all(
      dataBaseTokens?.map(async (item) => {
        try {
          const tokenPriceResponse = await axios({
            url: `https://public-api.dextools.io/standard/v2/token/solana/${item?.tokenAddress}/price`,
            method: "get",
            headers: {
              accept: "application/json",
              "x-api-key": process.env.DEXTOOLAPIKEY,
            },
          });
          const info = await axios({
            url: `https://public-api.dextools.io/standard/v2/token/solana/${item?.tokenAddress}/info`,
            method: "get",
            headers: {
              accept: "application/json",
              "x-api-key": process.env.DEXTOOLAPIKEY,
            },
          });
          const market_cap = await addCommas(info?.data?.data?.mcap);
          const tokenBalance = map.get(item?.tokenAddress);
          const change =
            tokenPriceResponse?.data?.data?.price - item?.currentPrice;
          const percentageChange = (change / item?.currentPrice) * 100;
          return {
            address: item?.tokenAddress,
            price_at_invested: item?.currentPrice,
            percentage: `${percentageChange?.toFixed(3)}%`,
            ...tokenPriceResponse?.data?.data,
            ...tokenBalance,
            ...info?.data?.data,
            market_cap,
          };
        } catch (error) {
          console.error(
            `Error fetching price for token ${item?.mint}:`,
            error?.message
          );
        }
      })
    );

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "Position fetched!!",
      data: { allTokenPrice },
    });
  } catch (error) {
    console.log("🚀 ~ positionsListForSolana ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Something has been wrong!!",
    });
  }
}

async function getPositionSingleTokenInfoSol(req, res) {
  try {
    const { token, chatId, email } = req?.body;

    // find wallet details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    const dataBaseTokens = await positions.findOne({
      network: 19999,
      userId: walletDetails?.id,
      tokenAddress: new RegExp(`^${token}$`, "i"),
    });
    if (!dataBaseTokens?.tokenAddress) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "no token found!!",
      });
    }

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "token found!!",
      dataBaseTokens,
    });
  } catch (error) {
    console.log("🚀 ~ getPositionSingleTokenInfo ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Something has been wrong!!",
    });
  }
}
async function getPositionSingleTokenInfoEvm(req, res) {
  try {
    const { token, chatId, email,chainId} = req?.body;
    console.log("🚀 ~ getPositionSingleTokenInfoEvm ~ chatId:", chatId)
    console.log("🚀 ~ getPositionSingleTokenInfoEvm ~ token:", token)
    console.log("🚀 ~ getPositionSingleTokenInfoEvm ~ chainId:", chainId)

    // find wallet details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    const dataBaseTokens = await positions.findOne({
      network: chainId,
      userId: walletDetails?.id,
      tokenAddress: new RegExp(`^${token}$`, "i"),
    });
    if (!dataBaseTokens?.tokenAddress) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "no token found!!",
      });
    }

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "token found!!",
      dataBaseTokens,
    });
  } catch (error) {
    console.log("🚀 ~ getPositionSingleTokenInfo ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Something has been wrong!!",
    });
  }
}

module.exports = { positionsListEvm, positionsListForSolana, getPositionSingleTokenInfoSol, getPositionSingleTokenInfoEvm };
