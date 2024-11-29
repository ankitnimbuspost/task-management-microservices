const mongoose = require('mongoose');

const taskStatusActivitySchema = mongoose.Schema({
    task_id:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"tasks"
    },
    before_status:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"task_status"
    },
    after_status:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"task_status"
    },
    added_by:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }
},{ timestamps: true});

const TaskStatusActivity = mongoose.model("task_status_activity",taskStatusActivitySchema);

module.exports = TaskStatusActivity;