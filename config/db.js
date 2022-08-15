const mongoose = require("mongoose");
const db = mongoose.connection;

mongoose.connect(process.env.MONGO_URI);
db.on("error", (error) => console.log(error.message));
db.once("open", () => console.log("MongoDb is connected"));
