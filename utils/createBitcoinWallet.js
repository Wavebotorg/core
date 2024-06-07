const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const BIP32Factory = require("bip32").default;
const ecc = require("tiny-secp256k1");

// Initialize BIP32Factory with tiny-secp256k1
const bip32 = BIP32Factory(ecc);

// Function to create a new Bitcoin wallet
const createBTCWallet = async () => {
  try {
    // Generate a random mnemonic (12 words)
    const mnemonic = bip39.generateMnemonic();
    console.log("Mnemonic:", mnemonic);

    // Generate seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Create root node using the seed
    const root = bip32.fromSeed(seed);

    // Derive the first account based on BIP44 (Bitcoin Mainnet)
    const account = root.derivePath("m/44'/0'/0'");

    // Derive the first address of the first account
    const keyPair = account.derivePath("0/0");

    // Get the private key in HEXA format
    const BTCprivateKeyHex = keyPair.privateKey.toString("hex");
    // console.log("Private Key (Hex):", BTCprivateKeyHex);

    // Get the private key in WIF format
    const BTCprivateKeyWIF = keyPair.toWIF();
    // console.log("Private Key (WIF):", privateKeyWIF);

    // Get the public key
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    console.log("Address:", address);

    return { BTCprivateKeyWIF, BTCprivateKeyHex, address };
  } catch (error) {
    console.error("Error creating wallet:", error);
  }
};

module.exports = { createBTCWallet };
