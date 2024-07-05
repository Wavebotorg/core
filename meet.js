const { default: Moralis } = require("moralis");

async function getPrice() {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjgwODYzM2EwLTlkMzMtNDkwYS1hZTEwLTMwMzc3YzYxZjhjZiIsIm9yZ0lkIjoiMzkwNzEwIiwidXNlcklkIjoiNDAxNDc0IiwidHlwZUlkIjoiZjAwMzU1YzUtMDRiNi00NWZhLThlNzYtMGUzNjI4MmY4M2Q1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTQ3Mjc5MzQsImV4cCI6NDg3MDQ4NzkzNH0.emk4y4vOTnyqSdwQKL00MSonKQJnlC3gu0bX_xKgWSI",
    });
  }
  const OutTokenCurrentPrice = await Moralis.EvmApi.token.getTokenPrice({
    chain: 42161,
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  });
    console.log("🚀 ~ OutTokenCurrentPrice:", OutTokenCurrentPrice?.raw?.usdPrice);
}

getPrice();
