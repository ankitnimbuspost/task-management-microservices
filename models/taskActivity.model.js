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
        enum:['summary','description','status','tags','owners','parent','attachment','duration','complete per','priority','sprint','resolution'],
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

// Get complete task history with pagination
taskActivitySchema.statics.getCompleteTaskHistory = async function(filter,limit,skip){
    try{
        const CommonHelper = require('../helpers/common.helper');

        let history = await this.find(filter).populate({path:"added_by",select:"f_name l_name"})
        .limit(limit).skip(skip).sort({created:-1}).lean().exec();
        // Convert Timestapm to Proper Date 
        history = history.map(his => ({
            ...his,
            created: CommonHelper.converToDate1(his.created),
            updated: CommonHelper.converToDate1(his.updated),
        }));
        return history;
    }
    catch(error){
        console.log(error.message);
    }
}
// Count Task History via Task ID
taskActivitySchema.statics.countHistory = async function(filter={}){
    try{
       return await this.countDocuments(filter);
    }
    catch(error){
        console.log(error.message);
        return 0;
    }
}
const TaskActivity = mongoose.model("task_activity",taskActivitySchema);

module.exports = TaskActivity;