const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
    company_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"companies",
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"users",
    },
    project_owners:[{
        type:mongoose.Types.ObjectId,
        ref:"users",
        default:null //List of Project Owners
    }],
    project_name:{
        type:String,
        required:true,
    },
    project_desc:{
        type:String,
        required:true,
    },
    status:{
        type:Number,
        enum:[0,1],
        default:1
    },
    created:{
        type:Number,
        required:true,
        default : Math.floor(Date.now()/1000),
    },
    updated:{
        type:Number,
        required:true,
        default : Math.floor(Date.now()/1000),
    }
});

// This Function Check Project is Exists or Not 
projectSchema.statics.checkProjectExists = async function(project_id){
    try {
        let count =  await this.countDocuments({_id:project_id});
        return count;
    } catch (error) {
        return 0;
    }
}
const ProjectModel = mongoose.model("projects",projectSchema);
module.exports = ProjectModel;
