const mongoose = require("mongoose");
const config = require("../config/config");

const taskSchema = mongoose.Schema({
    task_id:{
        type:String,
        minlength:1,
        maxlength:10,
    },
    project_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"projects",
    },
    added_by:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"users",
    },
    owners:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        default : ""
    }],
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
    tags:[{
        type:String,
        default:""
    }],
    attachment_urls:[{
        type:String,
        default:""
    }],
    start_date:{
        type:Number,
        default: "",
    },
    due_date:{
        type:Number,
        default: "",
    },
    duration:{
        unit:{
            type:String,
            default:"hrs"
        },
        value:{
            type:Number,
            default:"0"
        }
    },
    complete_per:{
        type:Number,
        default:""
    },
    priority:{
        type:String,
        enum:['','High','Medium','Low'],

    },
    task_status:{
        type:String,
        enum:config.TASK_STATUS,
        default :"open"

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
},{ versionKey: false });

// Static method to Count Tasks
taskSchema.statics.countTasks = async function(user_id) {
    const count = await this.countDocuments({ added_by: user_id });
    return count 
};

//Check task exists or not
taskSchema.statics.checkTaskExists = async function(task_id){
    try {
        const task = await this.findOne({_id:task_id});
        return !!task;
    } catch (error) {
        return false;
    }
}

const TaskModel = mongoose.model("tasks",taskSchema);
module.exports = TaskModel;