const axios = require('axios');
const userModel = require('../Models/userModel')
const HTTP = require('../../constants/responseCode.constant')
const portfolio = require('../Models/portfolio')


async function getCoinPrice(id) {
    try {
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
        const coinData = response.data.filter(d => d.id == id);

        return coinData[0]
    } catch (error) {
        console.error('Error updating watchlist with API data:', error);
        throw error;
    }
}

const buy = async (req, res) => {
    try {
        const { quantity, id } = req.body;
        console.log("🚀 ~ buy ~ req.body:", req.body)
        const coinInfo = await getCoinPrice(id);
        const totalCost = quantity * coinInfo.current_price;
        console.log("Total Cost:", totalCost);
        const purchasedCoin = new portfolio({
            userid: req.user.id,
            name: coinInfo.name,
            price: coinInfo.current_price,
            quantity: quantity,
            totalCost: totalCost
        });
        const userBalance = await userModel.findById(req.user.id);
        if (!userBalance) {
            return res.status(HTTP.NOT_FOUND).json({ success: false, message: "User not found." });
        }
        if (userBalance.balance >= totalCost) {
            // console.log("User balance is sufficient.");
            userBalance.balance -= totalCost;
            await userBalance.save();
            const findCoin = await portfolio.findOne({ name: { $regex: new RegExp(id, 'i') } });
            if (findCoin) {
                console.log("if part")
                // console.log("🚀 ~ buy ~ findCoin.price:", findCoin)
                findCoin.quantity += parseInt(quantity)
                console.log("🚀 ~ buy ~ findCoin.price:", findCoin.price)
                console.log("🚀 ~ buy ~ quantity:", quantity)
                console.log("🚀 ~ buy ~ findCoin.quantity:", findCoin.quantity)
                findCoin.totalCost = findCoin.quantity * findCoin.price
                findCoin.save()
            } else {
                console.log("else part")
                await purchasedCoin.save()
            }
            // await purchasedCoin.save();
            res.status(200).json({
                success: true,
                message: `Successfully bought ${quantity} ${coinInfo.name} for $${totalCost}.`
            });
        } else {
            console.log("Insufficient balance.");
            res.status(400).json({
                success: false,
                message: 'Insufficient balance.'
            });
        }
    } catch (error) {
        console.log("Error:", error.message);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ 'status': false, 'code': HTTP.INTERNAL_SERVER_ERROR, 'msg': 'Something went wrong!', data: {} });
    }
};


const sell = async (req, res) => {
    try {
        const { quantity, id } = req.body;
        console.log("🚀 ~ sell ~ req.body:0", req.body);
        const coinInfo = await getCoinPrice(id);
        const totalSaleAmount = quantity * coinInfo.current_price;
        console.log("Total Sale Amount:", totalSaleAmount);

        const userPortfolio = await portfolio.findOne({ userid: req.user.id, name: coinInfo.name });
        if (!userPortfolio) {
            return res.status(HTTP.NOT_FOUND).json({ success: false, message: "Coin not found in user's portfolio." });
        }

        if (userPortfolio.quantity >= quantity) {
            userPortfolio.quantity -= quantity;
            if (userPortfolio.quantity === 0) {
                await userPortfolio.remove();
            } else {
                userPortfolio.totalCost = userPortfolio.quantity * userPortfolio.price;
                await userPortfolio.save();
            }
            const userBalance = await userModel.findById(req.user.id);
            userBalance.balance += totalSaleAmount;
            await userBalance.save();

            res.status(200).json({
                success: true,
                message: `Successfully sold ${quantity} ${coinInfo.name} for $${totalSaleAmount}.`
            });
        } else {
            console.log("Insufficient quantity in the portfolio.");
            res.status(400).json({
                success: false,
                message: 'Insufficient quantity in the portfolio.'
            });
        }
    } catch (error) {
        console.log("Error:", error.message);
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ 'status': false, 'code': HTTP.INTERNAL_SERVER_ERROR, 'msg': 'Something went wrong!', data: {} });
    }
};

const addbalance = async (req, res) => {
    try {
        const { Addbalance } = req.body
        console.log("🚀 ~ addbalance ~ req.body:", req.body)
        const finduser = await userModel.findById(req.user.id)
        console.log("🚀 ~ addbalance ~ finduser:", finduser)
        if (!finduser) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "User Not Found" })
        }
        const newBalance = finduser.balance += parseInt(Addbalance)
        const update = await userModel.findOneAndUpdate({ _id: req.user.id }, { balance: newBalance }, { new: true })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Register Successfully", data: update })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.msg })
    }
};

const viewBalance = async (req, res) => {
    try {
        const findUser = await userModel.findById(req.user.id);
        if (!findUser) {
            return res.status(HTTP.NOT_FOUND).send({ status: false, code: HTTP.NOT_FOUND, msg: "User Not Found" });
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "User Balance Retrieved Successfully", data: { balance: findUser.balance } });
    } catch (error) {
        return res.status(HTTP.INTERNAL_SERVER_ERROR).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
};


module.exports = {
    buy,
    addbalance,
    sell,
    viewBalance,
} 