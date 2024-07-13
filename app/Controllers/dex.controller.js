const axios = require("axios");
const HTTP = require("../../constants/responseCode.constant");
const { default: Moralis } = require("moralis");
const { getWalletInfo } = require("../../helpers");
const { address } = require("bitcoinjs-lib");
const { getEthBalance } = require("../kibaSwap/getBalanceOfNativeToken");

async function dexapi(req, res) {
  const { token, chain, nativeToken, chatId, network } = req.body;
  console.log("🚀 ~ dexapi ~ network:", network)
  console.log("🚀 ~ dexapi ~ chain:", chain);
  console.log("🚀 ~ dexapi ~ network:", network);
  console.log("🚀 ~ dexapi ~ token:", token);

  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const userfind = await getWalletInfo(chatId);
    let nativeTokenDetails;
    if (chain == 81457) {
      const data = await getEthBalance(userfind?.wallet);
      console.log("🚀 ~ dexapi ~ data:", data);
      nativeTokenDetails = [
        {
          symbol: "ETH",
          name: "ether",
          balance_formatted: data?.ethBalance,
          usd_price: data?.ethPrice,
          usd_value: data?.ethBalance * data?.ethPrice,
        },
      ];
    } else {
      const response2 =
        await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          chain,
          address: userfind?.wallet,
        });
      const rawResponse = response2?.raw();
      nativeTokenDetails = await rawResponse?.result.filter(
        (item) =>
          item?.token_address == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      );
    }
    const price = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/${network}/${token}/price`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const info = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/${network}/${token}/info`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const address = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/${network}/${token}`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const liq = await axios({
      url: `https://public-api.dextools.io/standard/v2/pool/${network}/${token}/liquidity`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });

    const data = {
      name: address?.data?.data?.name,
      address: address?.data?.data?.address,
      symbol: address?.data?.data?.symbol,
      price: price?.data?.data?.price,
      variation24h: price?.data?.data?.variation24h,
      totalSupply: info?.data?.data?.totalSupply,
      circulatingSupply: info?.data?.data?.circulatingSupply,
      mcap: info?.data?.data?.mcap,
      makers: info?.data?.data?.holders,
      nativeTokenDetails: nativeTokenDetails ? nativeTokenDetails[0] : null,
      variation5m: price?.data?.data?.variation5m,
      variation1h: price?.data?.data?.variation1h,
      variation6h: price?.data?.data?.variation6h,
      variation24h: price?.data?.data?.variation24h,
      liq: liq?.data?.data?.liquidity,
    };

    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "token details fetch!!",
      data: data,
    });
  } catch (error) {
    console.error(
      "Error fetching data from Dextools API:",
      error.response ? error.response.data : error.message
    );
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Somthing has been wrong please try again later!!",
    });
  }
}

async function dexSol(req, res) {
  try {
    const { chatId, token } = req.body;
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const userfind = await getWalletInfo(chatId);
    const moralisApiCall = await Moralis.SolApi.account.getBalance({
      network: "mainnet",
      address: userfind?.solanawallet,
    });
    const priceApiCall = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/solana/${token}/price`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const nativePriceApiCall = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/solana/So11111111111111111111111111111111111111112/price`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const infoApiCall = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/solana/${token}/info`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const addressApiCall = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/solana/${token}`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const liquidityApiCall = await axios({
      url: `https://public-api.dextools.io/standard/v2/pool/solana/${token}/liquidity`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    const [
      response,
      price,
      nativePrice,
      info,
      address,
      liq
    ] = await Promise.all([
      moralisApiCall,
      priceApiCall,
      nativePriceApiCall,
      infoApiCall,
      addressApiCall,
      liquidityApiCall
    ]);
    console.log("🚀 ~ dexSol ~ liq:", liq?.data?.data)
    console.log("🚀 ~ dexSol ~ address:", address?.data?.data)
    console.log("🚀 ~ dexSol ~ info:", info?.data?.data)
    console.log("🚀 ~ dexSol ~ price:", price?.data?.data)
    const data = {
      name: address?.data?.data?.name,
      address: address?.data?.data?.address,
      symbol: address?.data?.data?.symbol,
      price: price?.data?.data?.price,
      variation24h: price?.data?.data?.variation24h,
      totalSupply: info?.data?.data?.totalSupply,
      circulatingSupply: info?.data?.data?.circulatingSupply,
      mcap: info?.data?.data?.mcap,
      nativeTokenDetails: response,
      nativePrice: nativePrice?.data?.data?.price,
      makers:info?.data?.data?.holders,
      variation5m: price?.data?.data?.variation5m,
      variation1h: price?.data?.data?.variation1h,
      variation6h: price?.data?.data?.variation6h,
      variation24h: price?.data?.data?.variation24h,
      liq: liq?.data?.data?.liquidity,
    };
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "token details fetch!!",
      data: data,
    });
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      message: "somthing has been wrong!!",
    });
  }
}
module.exports = { dexapi, dexSol };
