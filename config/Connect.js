const mongoose = require('mongoose');

const connectDBs = () => {
    try {
        //  * add main db link here
        const maindb = mongoose.createConnection(process.env.mongoDb, {});
        const keypairdb = mongoose.createConnection(process.env.keypairDb, {});

        console.log("DB Connected");
        return { maindb, keypairdb };

  } catch (error) {
    console.error(`Coudn't connect to db.\n Error:${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDBs };