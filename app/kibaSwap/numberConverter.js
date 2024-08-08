const { ethers } = require("ethers");

function convertToBigInt(decimalString) {
  try {
    // Convert the decimal string to BigNumber using the specified number of decimals
    const bigNumberValue = ethers.utils.parseUnits(
      decimalString.toString(),
      18
    );
    return bigNumberValue;
  } catch (error) {
    console.error("Invalid decimal string:", error);
    return null;
  }
}
function convertToNormalNumber(value) {
  try {
    const decimalString = ethers.utils.formatUnits(value, 18);
    return decimalString;
  } catch (error) {
    console.error("Invalid BigNumber value:", error);
    return null;
  }
}

module.exports={ convertToBigInt, convertToNormalNumber };
