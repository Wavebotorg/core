const { default: Moralis } = require("moralis");

async function getEvmTokenMetadata(wallet, network) {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjFjNmIxYWYyLTE0NjUtNGJiYy1hMTY1LWM3ZjMzMGNkY2EyZiIsIm9yZ0lkIjoiMzkwODI0IiwidXNlcklkIjoiNDAxNTkxIiwidHlwZUlkIjoiYzNjYTI5MzQtYTU5MS00YjQ4LTk0MjQtOTg0ZWVkMzZlMTA5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTQ3OTExNDYsImV4cCI6NDg3MDU1MTE0Nn0.x5unFuOwUE_Mz366qua85jkp8a8QBdcj4QwNnrls6ao",
      });
    }

    const response = await Moralis.EvmApi.token.getTokenMetadata({
      chain: network,
      addresses: [wallet],
    });

    const metadata = response.raw;
    return metadata?.[0].decimals;
  } catch (e) {
    console.error(e);
  }
}

module.exports = { getEvmTokenMetadata };
