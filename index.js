require("dotenv").config({ path: "./config/.env" });
const express = require("express");
const app = express();
const passport = require("passport");
const bodyParser = require("body-parser");
const path = require("path");
const PORT = process.env.PORT || 3333;
const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use("/uploads", express.static("uploads"));
// Serve static files from the 'public' directory
app.use("/qrcodes", express.static(path.join(__dirname, "public", "qrcodes")));
app.use("/img", express.static("img"));
require("./config/Connect");
require("./config/passport");
app.use(passport.initialize());
app.use(express.json());
app.use(express.static("emailtemplets"));
app.use("/", require("./app/routers/userRouter"));
app.use("/admin", require("./app/routers/adminRouter"));

app.all("*", (req, res) => {
  res.send("URL not found");
});

app.listen(PORT, () => {
  console.log(`Server listening on`, PORT);
});
