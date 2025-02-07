const mongoose = require('mongoose');

const taskActivitySchema = mongoose.Schema({
    task_id:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"tasks"
    },
    before:{
        required:true,
        type:String,
    },
    after:{
        required:true,
        type:String,
    },
    added_by:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    update_subject:{
        required:true,
        type:String,
        enum:['summary','description','status','tags','owners','parent','attachment','duration','complete per','priority'],
    },
    created:{
        type:Number,
        required:true,
        default : Math.floor(Date.now()/1000),
    },
},{ timestamps: false,versionKey:false});
taskActivitySchema.index({ task_id: 1 });
taskActivitySchema.index({ created: 1 });
taskActivitySchema.index({update_subject:1});

const TaskActivity = mongoose.model("task_activity",taskActivitySchema);

module.exports = TaskActivity;