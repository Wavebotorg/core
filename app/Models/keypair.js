const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const { connectDBs } = require("../../config/Connect");
const { keypairdb } = connectDBs();

const dataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  evmData: {
    type: Object,
    // required: true
  },
  btcData: {
    type: Object,
    // required: true,
  },
  solData: {
    type: Object,
    // required: true,
  },
  flag: {
    type: String,
  },
});

// Encryption function
function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    encryptedData: encrypted.toString("hex"),
    iv: iv.toString("hex"),
  };
}

// Decryption function
function decryptData(encryptedData, iv, key) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(iv, "hex"));
  let decrypted = decipher.update(Buffer.from(encryptedData, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = {
  keypair: keypairdb.model("keypair", dataSchema),
  //   value1: db1.model("value1", dataSchema),
  //   value2: db2.model("value2", dataSchema),
  //   value3: db3.model("value3", dataSchema),
  encryptData,
  decryptData,
};
