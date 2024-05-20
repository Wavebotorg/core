const { ethers } = require("ethers");
const ERC20ABI = require("./erc20.json");
const { getSigner } = require("./signer");

async function getTokenApproval(
  tokenContractAddress,
  spenderAddress,
  spendingAmount,
  signerAddress,
  signer
) {
  // Check if the spender has sufficient allowance
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    ERC20ABI,
    signer
  );
  console.log("🚀 ~ tokenContract:", tokenContract);
  const limitOrderContractAllowance = await tokenContract.allowance(
    signerAddress,
    spenderAddress
  );
  console.log("🚀 ~ limitOrderContractAllowance:", limitOrderContractAllowance);
  console.log(
    `token (${await tokenContract.symbol()}) Allowance: ${limitOrderContractAllowance}`
  );

  // if (Number(limitOrderContractAllowance) < spendingAmount) {
  console.log(
    `Insufficient allfowance, getting approval for ${await tokenContract.symbol()}...`
  );
  try {
    const gasPrice = await signer.getGasPrice();
    const gasLimit = ethers.utils.hexlify(300000);
    // Call the ERC20 approve method
    const approvalTx = await tokenContract.approve(
      spenderAddress,
      BigInt(spendingAmount),
      {
        gasPrice: gasPrice, // Use the current gas price
        gasLimit: gasLimit,
      }
    );

    // Wait for the approve tx to be executed
    const approvalTxReceipt = await approvalTx.wait();
    console.log(
      `Approve tx executed with hash: ${approvalTxReceipt?.transactionHash}`
    );
    return approvalTxReceipt?.transactionHash;
  } catch (error) {
    console.log(error);
  }
  // }
}

module.exports = { getTokenApproval };
