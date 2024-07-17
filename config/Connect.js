const mongoose = require('mongoose');

// mongoose.connect(process.env.maindb, {
//     useNewUrlParser: true,
//     useUnifiedTopology:true,
// })
//     .then(() => { console.log("DB Connect Successfully") })
//     .catch((err) => { console.log("DB Not Connected",err) })

// module.exports = mongoose

const connectDBs = () => {
    try {
        //  * add main db link here
        const maindb = mongoose.createConnection(process.env.mongoDb, {});
        const keypairdb = mongoose.createConnection(process.env.keypairDb, {});

        console.log("DB Connected");
        return { maindb, keypairdb };

        //  * three diff dbs
        // const mymongodb = mongoose.createConnection(process.env.maindb, {});
        // const db1 = mongoose.createConnection(process.env.db1, {});
        // const db2 = mongoose.createConnection(process.env.db2, {});
        // const db3 = mongoose.createConnection(process.env.db3, {});
        console.log("DB Connected");
        return { mymongodb, db1, db2, db3 };

  } catch (error) {
    console.error(`Coudn't connect to db.\n Error:${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDBs };