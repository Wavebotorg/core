const axios = require("axios");
const HTTP = require("../../constants/responseCode.constant");

async function dexapi(req, res) {
    const { token, chain } = req.body;
    console.log("🚀 ~ dexapi ~ chain:", chain)
    console.log("🚀 ~ dexapi ~ token:", token)

    try {
        const price = await axios({
            url: `https://public-api.dextools.io/standard/v2/token/${chain}/${token}/price`,
            method: "get",
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.DEXTOOLAPIKEY
            }
        });
        const info = await axios({
            url: `https://public-api.dextools.io/standard/v2/token/${chain}/${token}/info`,
            method: "get",
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.DEXTOOLAPIKEY
            }
        });
        const addres = await axios({
            url: `https://public-api.dextools.io/standard/v2/token/${chain}/${token}`,
            method: "get",
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.DEXTOOLAPIKEY
            }
        });

        console.log("🚀 ~ dexapi ~ dex.data:","price", price.data.data.price, "variation24h", price.data.data.variation24h)
        console.log("🚀 ~ dexapi ~ addres.data:","name", addres.data.data.name,"symbol",addres.data.data.symbol)
        console.log("🚀 ~ dexapi ~ info.data:","totalSupply", info.data.data.totalSupply,"circulatingSupply",info.data.data.circulatingSupply,"mcap",info.data.data.mcap)
        const data ={
            name:addres.data.data.name,
            symbol:addres.data.data.symbol,
            price:price.data.data.price,
            variation24h: price.data.data.variation24h,
            totalSupply:info.data.data.totalSupply,
            circulatingSupply:info.data.data.circulatingSupply,
            mcap:info.data.data.mcap
        }
        return res.status(HTTP.SUCCESS).send({
            status: true,
            code: HTTP.SUCCESS,
            message: "transaction successfull!!",
            data: data
          });
    } catch (error) {
        console.error("Error fetching data from Dextools API:", error.response ? error.response.data : error.message);
        return res.status(HTTP.SUCCESS).send({
            status: false,
            code: HTTP.BAD_REQUEST,
            message: "Somthing has been wrong please try again later!!",
        });
    }
}

module.exports = { dexapi };
