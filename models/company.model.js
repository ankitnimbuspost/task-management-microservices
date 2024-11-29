const mongoose = require('mongoose');

const companySchema = mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"users"
    },
    company_name:{
        type:String,
        required:true,
    },
    company_address:{
        type:String,
        required:true
    },
    company_pan:{
        type:String,
        // required:true,
    },
    company_gst:{
        type:String
    }
});

const CompanyModel = mongoose.model("companies",companySchema);

module.exports = CompanyModel;