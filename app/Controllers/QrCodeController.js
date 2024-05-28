const QRCode = require("qrcode");
const HTTP = require("../../constants/responseCode.constant");
const path = require("path");
const fs = require("fs");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");

const qrCodeFolder = path.join(__dirname, "..", "..", "public", "qrcodes");

async function getQrCode(req, res) {
  const { chatId, email, wallet } = req.body;
  if (!(chatId || email)) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "chat Id or Email Id required!!",
    });
  }
  const walletDetails =
    (chatId && (await getWalletInfo(chatId))) ||
    (email && (await getWalletInfoByEmail(email)));

  if (!walletDetails) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "wallet address not found!!",
    });
  }

  // Ensure the folder exists
  if (!fs.existsSync(qrCodeFolder)) {
    fs.mkdirSync(qrCodeFolder);
  }
  const walletAddress =
    wallet == 1 ? walletDetails?.wallet : walletDetails?.solanawallet;

  // Construct the full file path
  const qrCodeFilePath = path.join(qrCodeFolder, `${walletAddress}.png`);

  // Generate QR Code and save it as an image file
  QRCode.toFile(
    qrCodeFilePath,
    walletAddress,
    {
      color: {
        dark: "#000000", // Black dots
        light: "#FFFFFF", // White background
      },
    },
    function (err) {
      if (err) throw err;
      console.log(`QR code generated and saved to ${qrCodeFilePath}`);
    }
  );

  // Generate QR Code and get it as a data URL
  QRCode.toDataURL(walletAddress, function (err, url) {
    if (err) throw err;
    console.log(url);
  });

  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    message: "qrCode generated!!",
    path: `https://wavebot-191945f71768.herokuapp.com/qrcodes/${walletAddress}.png`,
    walletAddress: walletAddress,
  });
}
module.exports = { getQrCode };
