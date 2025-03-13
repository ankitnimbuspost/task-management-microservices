const mongoose = require("mongoose");
const config = require("../config/config");
const CommonHelper = require("../helpers/common.helper.js")

const taskSchema = mongoose.Schema({
    task_id:{
        type:String,
        minlength:1,
        maxlength:20,
    },
    parent_task_id: { type: mongoose.Schema.Types.ObjectId, ref: "tasks", default: null },
    task_type: { type: String, enum: ["Feature", "Bug", "Improvement", "Task"], default: "Task" },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "tasks", default: [] }],
    project_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"projects",
    },
    company_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:false,
        ref:"companies",
    },
    added_by:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"users",
    },
    owners:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        default : []
    }],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] }],
    task_name:{
        type:String,
        required:true,
    },
    task_desc:{
        type:String,
        required:true,
    },
    status:{
        type:Number,
        enum:[0,1],
        default:1
    },
    tags: {
        type: [String],
        default: []
    },
    labels: { 
        type: [String], 
        enum: config.LABEL_VALUES, 
        default: [] 
    },
    attachment_urls: {
        type: [String],
        default: []
    },
    start_date:{
        type:Number,
        default: null,
    },
    due_date:{
        type:Number,
        default: null,
    },
    duration:{
        unit:{
            type:String,
            enum: ["hours", "days"],
            default:"hours"
        },
        value:{
            type:Number,
            default:0
        }
    },
    complete_per:{
        type:Number,
        default:0
    },
    priority:{
        type:String,
        enum:['','High','Medium','Low'],
        default : "Medium"

    },
    task_status:{
        type:String,
        enum:config.TASK_STATUS,
        default :"open"

    },
    created:{
        type:Number,
        required:true,
        default: () => Math.floor(Date.now() / 1000),
    },
    updated:{
        type:Number,
        required:true,
        default: () => Math.floor(Date.now() / 1000),
    },
    deleted_at: { type: Number, default: null, index: true }, // Store Deletion time
},{ versionKey: false });


// Indexing Fields 
taskSchema.index({ task_id: 1 });
taskSchema.index({ project_id: 1 });
taskSchema.index({ added_by: 1 });
taskSchema.index({ parent_task_id: 1 });
taskSchema.index({ owners: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ created: -1 });
taskSchema.index({ updated: -1 });
taskSchema.index({ task_status: 1 });

// Static method to Count Tasks
taskSchema.statics.countTasks = async function(user_id) {
    const count = await this.countDocuments({ added_by: user_id,deleted_at: null });
    return count 
};
// Get sub tasks or improvement 
taskSchema.statics.getSubtasks = async function(parent_task_id) {
    return await this.find({ parent_task_id,deleted_at: null  });
};


//Check task exists or not
taskSchema.statics.checkTaskExists = async function(task_id){
    try {
        return await this.exists({ _id: `${task_id}`,deleted_at: null });
    } catch (error) {
        console.log(error.message)
        return false;
    }
}

//Get Task Full Details (All task info)
taskSchema.statics.getFullTaskInfo = async function(task_id){
    try {
        const task = await this.findOne({_id:task_id,deleted_at: null}).populate({path:"project_id","select":'project_name _id'})
                .populate({path:"added_by","select":"f_name l_name"}).populate({path:"owners","select":"f_name l_name"}).lean();
        if(task==null)
            return false;
        task.created = CommonHelper.converToDate(task.created);
        task.updated = CommonHelper.converToDate(task.updated);
        task.start_date = CommonHelper.converToDate(task.start_date);
        task.due_date = CommonHelper.converToDate(task.due_date);
        return task;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

const TaskModel = mongoose.model("tasks",taskSchema);
module.exports = TaskModel;
