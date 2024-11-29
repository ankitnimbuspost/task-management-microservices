const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const userSchema = mongoose.Schema({
    f_name:{
        type:String,
        required:true,
        minlength:2,
        maxlength:50
    },
    l_name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    phone:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    password:{
        type:String,
        required:true,
        select: false
    },
    gender:{
        type:String,
        enum:['male', 'female', 'other']
    },
    address:{
        type:String,
        default:""
    },
    role:{
        type:String,
        default:0,
        enum:['admin','manager','developer','owner'],
        default:"developer"
    },
    phone_verified:{
        type:Number,
        default:0,
        enum:[0,1]
    },
    email_verified:{
        type:Number,
        default:0,
        enum:[0,1]
    },
    status:{
        type:Number,
        default:1,
        enum:[0,1]
    },
    access_token:{
        type:String,
        default:""
    }
});


// Static method to check if phone number exists
userSchema.statics.checkPhoneExists = async function(phoneNumber) {
    const user = await this.findOne({ phone: phoneNumber });
    return !!user; // Returns true if user with phone number exists, false otherwise
};
// Static method to check if Email exists
userSchema.statics.checkEmailExists = async function(email){
    const user = await this.findOne({email:email});
    return !!user;
}
// Static method to check if Password Match or Not
userSchema.statics.checkPasswordMatch = async function(email,password){
    let user =  await this.findOne({email:email}).select("+password");
    return await bcrypt.compare(password, user.password);
}



const UsersModel = mongoose.model("users",userSchema);
module.exports = UsersModel;