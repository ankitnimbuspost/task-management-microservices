const httpCode = require("../../config/error.config");
const CommonHelper = require("../../helpers/common.helper");
const TaskModel = require("../../models/task.model");
const TaskActivity = require("../../models/taskActivity.model");

module.exports.getTaskHistory = async function(req,res){
    let {all="false",skip=0} = req.headers;
    all = all.toLowerCase();
    let task_id = req.params['task_id']?.trim() ?? '';
    if (!task_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Task ID field is required." });
    else if(task_id && !await TaskModel.checkTaskExists(task_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Task/Issue ID." });
    else if(all==="true" && !Number.isInteger(Number(skip)))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Previous list count must be interger." });
    else{
        let filter = {task_id:task_id}
        let limit=30;
        if(all===true || all=="true")
            limit=0;
        else
            skip=0;
        let history = await TaskActivity.getCompleteTaskHistory(filter,limit,skip);
        let all_data_count = await TaskActivity.countHistory(filter);
        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Task History fetched successfully.", data: history,all_data_count:all_data_count,current_data_count:history.length });
    }
}