exports.getPoolImmutables = async (poolContract) => {
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee()
    ])
  
    const immutables = {
      token0: token0,
      token1: token1,
      fee: fee
    }
    return immutables
  }
  
  exports.getPoolState = async (poolContract) => {
    const slot = poolContract.slot0()
  
    const state = {
      sqrtPriceX96: slot[0]
    }
  
    return state
  }


  const userModel = require('./app/Models/userModel')
 

exports.getWalletInfo = async (chatId) => {
    // console.log("Fetching wallet information...");
    try {
        const user = await userModel.findOne({ chatId: chatId });
        console.log("User:", user);
        return {
            wallet: user.wallet,
            hashedPrivateKey: user.hashedPrivateKey,
        };
    } catch (error) {
        console.error('Error fetching wallet information from the database:', error.message);
        throw error;
    }
}