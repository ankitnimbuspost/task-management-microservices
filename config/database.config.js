const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL,{}).then((data)=>{
    console.log("DB Connected!");
}).catch((err)=>{
    console.log(`DB Connection error ${err.message}`);
})