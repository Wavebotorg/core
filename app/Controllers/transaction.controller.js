const Txn = require("../Models/Txn.model");
const TxnEvm = require("../Models/TXNevmSwap");
const HTTP = require("../../constants/responseCode.constant");

async function allTransactionHistory(req, res) {
  const { id } = req.body;
  const evm = id ? await TxnEvm.find({ userId: id }) : await TxnEvm.find();
  const sol = id ? await Txn.find({ userId: id }) : await Txn.find();
  const transactions = [...evm, ...sol];
  if (evm && sol) {
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "transactions fetch!!",
      transactions,
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: false,
    code: HTTP.UNAUTHORIZED,
    msg: "somehthing has been wrong !!",
  });
}

async function solanatransaction(req, res) {
  try {
    const userId = req.body?.id;
    const id = userId || req?.user?._id;
    console.log("🚀 ~ solanatransaction ~ id:", id);
    if (userId) {
      const transactions = await Txn.find({ userId: id }).select("-userId");
      if (!transactions) {
        console.log(
          "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a solana transaction"
        );
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.UNAUTHORIZED,
          msg: "somehthing has been wrong !!",
        });
      }

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "solana transactions fetch!!",
        transactions,
      });
    } else {
      const transactions = await Txn.find().select("-userId");
      if (!transactions) {
        console.log(
          "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a solana transaction"
        );
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.UNAUTHORIZED,
          msg: "somehthing has been wrong !!",
        });
      }

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        msg: "solana transactions fetch!!",
        transactions,
      });
    }
  } catch (error) {
    console.log("🚀 ~ solanatransaction ~ error:", error);
  }
}
async function evmtransaction(req, res) {
  const userId = req.body?.id;
  const { chainId } = req.body;
  console.log("🚀 ~ evmtransaction ~ chainId:", chainId);
  const id = userId || req?.user?._id;
  console.log("🚀 ~ evmtransaction ~ id:", id);

  if (chainId && userId) {
    const transactions = await TxnEvm.find({
      userId: id,
      chainId: chainId,
    }).select("-userId");
    if (!transactions) {
      console.log(
        "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a EVM transaction"
      );
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "EVM transactions fetch!!",
      transactions,
    });
  } else if (userId) {
    const transactions = await TxnEvm.find({
      userId: id,
    }).select("-userId");
    if (!transactions) {
      console.log(
        "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a EVM transaction"
      );
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "EVM transactions fetch!!",
      transactions,
    });
  } else if (chainId) {
    const transactions = await TxnEvm.find({
      chainId: chainId,
    }).select("-userId");
    if (!transactions) {
      console.log(
        "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a EVM transaction"
      );
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "EVM transactions fetch!!",
      transactions,
    });
  } else {
    const transactions = await TxnEvm.find().select("-userId");
    if (!transactions) {
      console.log(
        "🚀 ~ solanatransaction ~ transactions:somthing has been wrong while finding a EVM transaction"
      );
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "EVM transactions fetch!!",
      transactions,
    });
  }
}

async function solanaTransactionsCount(req, res) {
  const transactions = await Txn.find().countDocuments();
  if (!transactions) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.UNAUTHORIZED,
      msg: "no data found!!",
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "solana transactions fetch!!",
    transactions,
  });
}
async function evmTransactionsCount(req, res) {
  const transactions = await TxnEvm.find().countDocuments();
  if (!transactions) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.UNAUTHORIZED,
      msg: "no data found!!",
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    msg: "EVM transactions fetch!!",
    transactions,
  });
}
async function totalTransactionCount(req, res) {
  const evm = await TxnEvm.find().countDocuments();
  console.log("🚀 ~ totalTransactionCount ~ evm:", evm);
  const sol = await Txn.find().countDocuments();
  console.log("🚀 ~ totalTransactionCount ~ sol:", sol);
  const count = {
    solCount: sol,
    evmCount: evm,
  };
  if (evm && sol) {
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      msg: "transactions fetch!!",
      count,
    });
  }
  return res.status(HTTP.SUCCESS).send({
    status: false,
    code: HTTP.UNAUTHORIZED,
    msg: "something went wrong!!",
  });
}

module.exports = {
  solanatransaction,
  evmtransaction,
  solanaTransactionsCount,
  evmTransactionsCount,
  allTransactionHistory,
  totalTransactionCount,
};
