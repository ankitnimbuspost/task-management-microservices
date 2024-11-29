const mongoose = require("mongoose");

const taskStatusSchema = mongoose.Schema({
    task_status:{
        required:true,
        type:String,
        unique:true
    },
    dept_ids:[{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"Department"
    }],
    added_by:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }
},{ timestamps: true});

// This Methods return 1 if task status present otherwise return 0
taskStatusSchema.statics.checkTaskStatusExists = async function(task_status_name){
    let status = await this.findOne({"task_status":task_status_name});
    return !!status;
}
taskStatusSchema.statics.checkTaskStatusExistsById = async function(status_id){
    try {
        let status = await this.findOne({"_id":status_id});
        return !!status;
    } catch (error) {
        return 0;
    }
}



const TaskStatusModel = mongoose.model("task_status",taskStatusSchema);
module.exports = TaskStatusModel;