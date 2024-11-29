const mongoose = require("mongoose");

const assignSchema = mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
    },
    project_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"projects",
        required:true,
    },
    assigned_user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
    },
    status:{
        type:Number,
        enum:[0,1],
        default:1
    }
});

const ProjectAssignModel = mongoose.model('project_assign',assignSchema);
module.exports = ProjectAssignModel;