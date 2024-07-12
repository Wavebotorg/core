const { ethers } = require("ethers");
const tokenAbi = [
  // balanceOf
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    type: "function",
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    type: "function",
  },
];

async function getTokenBalance(tokenContractAddress, walletAddress, provider) {
  try {
    const tokenContract = new ethers.Contract(
      tokenContractAddress,
      tokenAbi,
      provider
    );
    // Fetch the token balance
    const balance = await tokenContract.balanceOf(walletAddress);

    // Fetch the token decimals
    const decimals = await tokenContract.decimals();

    // Format the balance using the fetched decimals
    let bal = ethers.utils.formatUnits(balance, decimals);
    return bal;
  } catch (error) {
    console.error("Error fetching balance or decimals:", error?.message);
    return 0
  }
}

module.exports = { getTokenBalance };
// getTokenBalance("0xb1547683DA678f2e1F003A780143EC10Af8a832B","0xA26f18FDB7f07f125FcdcF12B3f987601aFA1728");
// const tokenBalanceUserBuy = await getTokenBalance(
//   tokenOut,
//   walletDetails?.wallet,
//   provider
// );
// console.log("🚀 ~ EVMSwapMain ~ tokenBalanceUserBuy:", tokenBalanceUserBuy);