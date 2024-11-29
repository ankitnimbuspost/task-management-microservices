const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema({
    department:{
        required:true,
        type:String,
        unique:true
    },
    added_by:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }
},{ timestamps: true});

const DepartmentModel = mongoose.model("Department",departmentSchema);
module.exports = DepartmentModel;