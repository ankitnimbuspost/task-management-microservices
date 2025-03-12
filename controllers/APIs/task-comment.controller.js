
const httpCode = require("../../config/error.config");
const CommonHelper = require("../../helpers/common.helper");
const TaskModel = require("../../models/task.model");
const TaskCommentModel = require("../../models/taskComment.model");
//Create or Update Task Comment
module.exports.commentCreateUpdate = async function (req, res) {
    const { id: comment_id = '', comment, task_id, attachments=[] } = req.body;

    if (comment_id && !await TaskCommentModel.checkCommentExists(comment_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Comment ID" });
    else if (!comment) 
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Comment field is required." });
    else if (!comment_id && !task_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Task ID field is required." });
    else if (attachments && !Array.isArray(attachments)) 
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Attachment." });
    else{
        let data = {comment:comment,commented_by:req.user.id,updated:Math.floor(Date.now()/1000)};
        if(task_id){
            if(!await TaskModel.checkTaskExists(task_id))
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Task/Issue ID." });
            else
                data.task_id = task_id;
        }
        if(attachments.length>0)
            data.attachments = attachments

        log("task_update_notify","Task Update Notify",{
            task_id: task_id,
            section:"comment"
        });
        let commentData = await TaskCommentModel.createUpdate(comment_id,data);
        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Comment Created.", data: commentData });
    }
}

//Get Task Comments by Task ID(_id)
module.exports.getCommentByTask = async function(req,res){
    let {all="false",skip=0} = req.headers;
    all = all.toLowerCase();
    let task_id = req.params['task_id']?.trim() ?? '';
    if (!task_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Task ID field is required." });
    else if(task_id && !await TaskModel.checkTaskExists(task_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Task/Issue ID." });
    else if(all && !["true","false"].includes(all))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: `Invalid All params value, Allowed values are [${["true","false"]}].` });
    else if(all=="true" && !Number.isInteger(Number(skip)))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Skip count must be interger." });
    else{
        let filter = {task_id:task_id}
        let limit=30;
        if(all==true || all=="true")
            limit=0;
        else
            skip=0;

        let comments = await TaskCommentModel.find(filter).populate({path:"commented_by",select:"f_name l_name"})
        .limit(limit).skip(skip).sort({created:-1}).lean().exec();
        // Convert Timestapm to Proper Date 
        comments = comments.map(comment => ({
            ...comment,
            created: CommonHelper.converToDate1(comment.created),
            updated: CommonHelper.converToDate1(comment.updated),
        }));
        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Comment fetched successfully.", data: comments });
    }
}

//Delete Comment by Task ID, and Message ID
module.exports.deleteTaskComment = async function(req,res){
    let {task_id,comment_id} = req.params;
    
    if (!task_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Task ID field is required." });
    else if(!await TaskModel.checkTaskExists(task_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Task ID." });
    else if (!comment_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Comment ID field is required." });
    else if(!await TaskCommentModel.checkCommentExists(comment_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Comment ID." });
    else{
        await TaskCommentModel.findOneAndDelete({task_id:task_id,_id:comment_id});
        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Comment delete successfully."}); 
    }
}