const Txn = require("../Models/Txn.model");
const TxnEvm = require("../Models/TXNevmSwap");
const HTTP = require("../../constants/responseCode.constant");

async function solanatransaction(req, res) {

    try {
        const id = req?.user?._id
        console.log("🚀 ~ solanatransaction ~ id:", id)
        const transactions = await Txn.find({ userId:id }).select("-userId")
        if (!transactions) {
            console.log("🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a solana transaction")
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "somehthing has been wrong !!" });
        }

        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "solana transactions fetch!!", transactions });
    } catch (error) {
        console.log("🚀 ~ solanatransaction ~ error:", error)

    }
}
async function evmtransaction(req, res) {
    const id = req?.user?._id
    const transactions = await TxnEvm.find({ userId:id }).select("-userId")
    if (!transactions) {
        console.log("🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a EVM transaction")
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.UNAUTHORIZED, msg: "somehthing has been wrong !!" });
    }

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "EVM transactions fetch!!", transactions });
}

module.exports = {
    solanatransaction, evmtransaction
}