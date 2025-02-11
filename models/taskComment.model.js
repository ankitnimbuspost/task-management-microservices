const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    commented_by:{
        ref:"users",
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    task_id:{
        ref:"tasks",
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    comment:{
        type:String,
        required:true,
    },
    attachments:[{
        type:String,
        required:false
    }],
    created:{
        type:Number,
        required:true,
        default: () => Math.floor(Date.now() / 1000),
    },
    updated:{
        type:Number,
        required:true,
        default : Math.floor(Date.now()/1000),
    }
},{ versionKey: false });

commentSchema.index({ task_id: 1 });
commentSchema.index({ created: 1 });

commentSchema.statics.checkCommentExists = async function(task_id){
    try {
        const user = await this.findOne({ _id: task_id });
        return !!user;
    } catch (error) {
        return false;
    }
}
// This function create or update token 
commentSchema.statics.createUpdate = async function(id='',data){
    try {
        if (id && await this.checkCommentExists(id))
            return await this.findOneAndUpdate({ _id: id }, { "$set": data }, { new: true });
        else
            return await this.create(data);
    } catch (error) {
        console.error("Error in createUpdate:", error.message);
        return false;
    }
}
TaskCommenModel = mongoose.model("task_comment",commentSchema);
module.exports =TaskCommenModel;