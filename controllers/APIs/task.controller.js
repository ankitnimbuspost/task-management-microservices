const httpCode = require("../../config/error.config");
const ProjectModel = require("../../models/project.model");
const TaskModel = require("../../models/task.model");
const MQService = require("../../services/RabbitMQ.service");
const Config = require("../../config/config");
const TaskStatusModel = require("../../models/taskStatus.model");


// This Function Create A new Task.
module.exports.createTask = async function (req, res) {
    if (req.body['project_id'] == '' || req.body['project_id'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Project field is required." });
    else if (! await ProjectModel.checkProjectExists(req.body['project_id']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project, project not found." });
    else if (req.body['task_name'] == '' || req.body['task_name'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task Name field is required." });
    else if (req.body['task_desc'] == '' || req.body['task_desc'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task Description field is required." });
    else if (req.body['status'] != undefined && req.body['status'] != '' && ![1, 0].includes(req.body['status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project status, Allowed values are [0,1]." });
    else if (req.body['tags'] != undefined && (!Array.isArray(req.body['tags']) || req.body['tags'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Tags. It must be an array of strings." });
    else if (req.body['attachment_urls'] != undefined && (!Array.isArray(req.body['attachment_urls']) || req.body['attachment_urls'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Attachment URLs. It must be an array of strings." });
    else if (req.body['owners'] != undefined && typeof req.body['owners'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task owners." });
    else if (req.body['duration'] != undefined && typeof req.body['duration'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration." });
    else if (req.body['complete_per'] != undefined && req.body['complete_per'] != '' && typeof req.body['complete_per'] != "number")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project Completed persentage." });
    else if (req.body['priority'] != undefined && req.body['priority'] != '' && !['', 'High', 'Medium', 'Low'].includes(req.body['priority']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project priority, Allowed values are ['','High','Medium','Low']." });
    else if (req.body['task_status'] != undefined && req.body['task_status'] == '')
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task status field is required." });
    else if (!Config.TASK_STATUS.includes(req.body['task_status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid task status." });
    else if (req.body['start_date'] !== undefined && req.body['start_date'] !== "" && (!Number.isInteger(Number(req.body['start_date'])) || Number(req.body['start_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Start Date. It must be a valid epoch timestamp."});
    else if (req.body['due_date'] !== undefined && req.body['due_date'] !== "" && (!Number.isInteger(Number(req.body['due_date'])) || Number(req.body['due_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Due Date. It must be a valid epoch timestamp."});
    else {
        let duration = [];
        if (req.body['duration'] != undefined && req.body['duration'] != "") {
            duration = req.body['duration'];
            if (!duration.unit || !duration.value || typeof duration.unit != "string" || typeof duration.value != "number")
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration field structure." });
            else if (!(duration.unit.toLowerCase() == 'days' || duration.unit.toLowerCase() == 'hours'))
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration Unit, Allowed values are [Days,Hours]." });
            else
                duration.unit = duration.unit.toLowerCase();
        }
        if (req.body['complete_per'] != undefined && req.body['complete_per'] != "") {
            if (req.body['complete_per'] > 100 || req.body['complete_per'] < 0)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Completed persentage, Allowed values are [0-100]." });
        }
        let owners = [];
        //Now Check Project Owners from Task Microservices
        if (req.body['owners'] != undefined && req.body['owners'] != "") {
            owners = req.body['owners'];
            let data = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user: req.user.id, data: owners });
            // Now Check Task Owner ID one by one 
            let user_not_found = '';
            owners.forEach(function (element, index) {
                if (data[`${element}`] == 0)
                    user_not_found += element + ", ";
            });
            if (user_not_found != '')
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Project Owners ${user_not_found} users` });
        }
        let task_id = await MQService.getDataFromM1({ action: "GET_TASK_ID", login_user: req.user.id });
        if (!task_id)
            return res.status(httpCode.NOT_ACCEPTABLE).json({ code: httpCode.NOT_ACCEPTABLE, message: "Please complete KYC." });
        let current_user = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: req.user.id });
            
        let data = {
            task_id: task_id,
            project_id: req.body['project_id'],
            added_by: req.user.id,
            task_name: req.body['task_name'],
            task_desc: req.body['task_desc'],
            status: req.body['status'] ??  1,
            tags: req.body['tags'] ?? [],
            start_date: req.body['start_date'] ?? null,
            due_date: req.body['due_date'] ?? null,
            complete_per: req.body['complete_per'] ?? '',
            priority: req.body['priority'] ?? "",
            duration: duration,
            owners: owners,
            task_status: req.body['task_status'] ?? "",
            company_id: current_user?.company_id || null,
            attachment_urls : req.body['attachment_urls'] ?? [],
        }

        let result = await TaskModel.create(data);
        // Create Log 
        log("panel_log","TASK_CREATE_UPDATE",{
            prev_data: {},
            current_data: result,
            user_id: req.user.id,
            action: "TASK_CREATE_UPDATE"
        });
        if (result != null)
            res.status(httpCode.OK).json({ code: httpCode.OK, message: "Task created successfully.", data: result });
        else
            res.status(httpCode.INTERNAL_SERVER_ERROR).json({ code: httpCode.INTERNAL_SERVER_ERROR, message: "Something went wrong.", data: result })
    }
}

//This Function Update existing Task
module.exports.updateTask = async function (req, res) {
    const {  owners } = req.body;
    let updateData = {};
    if (req.body['id'] == '' || req.body['id'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task ID field is required." });
    else if (! await TaskModel.checkTaskExists(req.body['id']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task ID, task not found." });
    else if (req.body['owners'] != undefined && typeof req.body['owners'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task owners." });
    else if (req.body['duration'] != undefined && typeof req.body['duration'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task duration." });
    else if (req.body['tags'] != undefined && typeof req.body['tags'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task tags." });
    else if (req.body['attachment_urls'] != undefined && (!Array.isArray(req.body['attachment_urls']) || req.body['attachment_urls'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Attachment URLs. It must be an array of strings." });
    else if (req.body['priority'] != undefined && req.body['priority'] != '' && !['', 'High', 'Medium', 'Low'].includes(req.body['priority']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project priority, Allowed values are ['','High','Medium','Low']." });
    else if (req.body['task_status'] != undefined && req.body['task_status'] != '' && !Config.TASK_STATUS.includes(req.body['task_status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Task Status, Allowed values are [${Config.TASK_STATUS}].` });
    else if (req.body['start_date'] !== undefined && req.body['start_date'] !== "" && (!Number.isInteger(Number(req.body['start_date'])) || Number(req.body['start_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Start Date. It must be a valid epoch timestamp."});
    else if (req.body['due_date'] !== undefined && req.body['due_date'] !== "" && (!Number.isInteger(Number(req.body['due_date'])) || Number(req.body['due_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Due Date. It must be a valid epoch timestamp."});
    else {
        if (req.body['status'] || req.body['status'] == 0) {
            if (typeof req.body['status'] == "number" && [1, 0].includes(req.body['status']))
                updateData.status = req.body['status'];
            else
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Status, Allowed values are [0,1]." });
        }
        if (req.body['complete_per'] != undefined && req.body['complete_per'] != "") {
            if (req.body['complete_per'] > 100 || req.body['complete_per'] < 0)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Completed persentage, Allowed values are [0-100]." });
            else
                updateData.complete_per = req.body['complete_per'];
        }
        let duration = [];
        if (req.body['duration'] != undefined && req.body['duration'] != "") {
            duration = req.body['duration'];
            if (!duration.unit || !duration.value || typeof duration.unit != "string" || typeof duration.value != "number")
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration field structure." });
            else if (duration.unit.toLowerCase() == 'days' || duration.unit.toLowerCase() == 'hours'){
                duration.unit = duration.unit.toLowerCase();
                updateData.duration = duration;
            }
            else
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration Unit, Allowed values are [Days,Hours]." });
        }
        let prev_data = await TaskModel.findOne({ _id: req.body['id'] });
        // Now Check Project Owners from Task Microservices
        if (owners && owners !== "") {
            const ownerValidation = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user: req.user.id, data: owners });
            const invalidOwners = owners.filter(owner => !ownerValidation[owner]);
            if (invalidOwners.length)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: `Invalid Project Owners: ${invalidOwners.join(", ")}` });
        }
        if (req.body['tags'])
            updateData.tags = req.body['tags'];
        if (req.body['attachment_urls'])
            updateData.attachment_urls = req.body['attachment_urls'];
        if (req.body['priority'])
            updateData.priority = req.body['priority'];
        if(req.body['start_date'])
            updateData.start_date = req.body['start_date'];
        if(req.body['due_date'])
            updateData.due_date = req.body['due_date'];
        if (req.body['task_status']){
            updateData.task_status = req.body['task_status'];
            // now create activity log for task status 
            if(prev_data.task_status!=req.body.task_status){
                log("task_activity","Task Update",{
                    task_id: req.body.id,
                    before: prev_data.task_status,
                    after: req.body.task_status,
                    added_by: req.user.id,
                    update_subject:"status"
                });
            }
        }
        if(req.body['task_name']){
            updateData.task_name = req.body['task_name'];
            // now create activity log for task status 
            if(req.body.task_name!=prev_data.task_name){
                log("task_activity","Task Update",{
                    task_id: req.body.id,
                    before: prev_data.task_name,
                    after: req.body.task_name,
                    added_by: req.user.id,
                    update_subject:"summary"
                });
            }
        }
        if(req.body['task_desc']){
            updateData.task_desc = req.body['task_desc'];
            // now create activity log for task status 
            if(req.body.task_desc!=prev_data.task_desc){
                log("task_activity","Task Update",{
                    task_id: req.body.id,
                    before: prev_data.task_desc,
                    after: req.body.task_desc,
                    added_by: req.user.id,
                    update_subject:"description"
                });
            }
        }
        updateData.updated = Math.floor(Date.now() / 1000);
        let result = await TaskModel.findOneAndUpdate({ _id: req.body['id'] }, { "$set": updateData }, { new: true });
        // Create Log 
        log("panel_log","TASK_CREATE_UPDATE",{
            prev_data: prev_data,
            current_data: result,
            user_id: req.user.id,
            action: "TASK_CREATE_UPDATE"
        });
        if (result != null)
            res.status(httpCode.OK).json({ code: httpCode.OK, message: "Task updated successfully.", data: result })
    }


}

//This function return all task status
module.exports.getTaskStatus = async function (req, res) {
    let status = Config.TASK_STATUS;
    res.json({
        code: httpCode.OK,
        message: "Task Sttaus Listing.",
        data: status
    });
    // let status = await TaskStatusModel.find({dept_ids:{$in:['664f4bd79f34d2c4f30c3fec','664f4bf23a39b5b9ff8f92a2','665038b339d48ca39bfdc47d','661253f489a31fa6c29b6c11']}})
    // .populate({'path':'dept_ids','select':'department','model':'Department',
    // match:{'added_by':'661253f489a31fa6c29b6c11'},
    // options:{sort:{"department":-1},limit:5}
    // }).populate({path:'added_by',select:'f_name l_name email phone'})
    // // .populate('dept_ids').exec();
    // res.json({
    //     code: httpCode.OK,
    //     message:"Task Status.",
    //     data:status
    // })
}

//Get Tasks by Filter
module.exports.getTaskList = async function (req, res) {
    let list_type = req.body['list_type'] ?? '';
    let project_ids = await ProjectModel.find({ project_owners: req.user.id }).select({ "_id": 1, "company_id": 1 });
    let allowProjectIds = [];
    project_ids.map((value) => {
        allowProjectIds.push(value._id);
    });
    var filter = { status: 1, project_id: { "$in": allowProjectIds } };
    if (req.body['owners'] != undefined && req.body['duration'] != "")
        filter.owners = { "$in": req.body['owners'] };
    if (req.body['tags'] != undefined && req.body['tags'] != "")
        filter.tags = { "$in": req.body['tags'] };
    if (req.body['task_id'] != undefined && req.body['task_id'] != "")
        filter.task_id = req.body['task_id'];
    if (req.body['id'] != undefined && req.body['id'] != "")
        filter._id = req.body['id'];
    if (req.body['project_id'] != undefined && req.body['project_id'] != "")
        filter.project_id = req.body['project_id'];
    if (req.body['added_by'] != undefined && req.body['added_by'] != "")
        filter.added_by = req.body['added_by'];
    if (req.body['task_status'] != undefined && req.body['task_status'] != "")
        filter.task_status = req.body['task_status'];
    if (req.body['priority'] != undefined && req.body['priority'] != "")
        filter.priority = req.body['priority'];
    if (req.body['task_name'] != undefined && req.body['task_name'] != "")
        filter.task_name = { $regex: req.body['task_name'], $options: 'i' }
    // console.log(filter)
    let tasks = [];
    try {
        tasks = await TaskModel.find(filter)
            .populate({ path: "project_id", select: "_id project_name" })
            .populate({ path: "added_by", select: '_id f_name l_name' })
            .populate({ path: "owners", select: "f_name l_name" }).sort({ "_id": -1 }).lean();

        let groupedTasks = {};
        let all_task_status = Config.TASK_STATUS;
        // groupedTasks[`${status}`] = [];
        all_task_status.forEach(status => {
            if (groupedTasks[`${status}`] == null)
                groupedTasks[`${status}`] = { "title": status.toUpperCase(), "tasks": [] };
        });

        var results = tasks.map(task => {
            task.project_info = task.project_id;
            delete task.project_id;
            //For Kanban List
            if (list_type.toLowerCase() == 'kanban') {
                // groupedTasks[task.task_status].push(task);
                groupedTasks[task.task_status].tasks.push(task)
            }
            return task;
        });
        if (list_type.toLowerCase() == 'kanban')
            results = groupedTasks;

        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Tasks Listing.", data: results });
    } catch (error) {
        res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: error.message });
    }
}
//Get Singal Task 
module.exports.getSingalTask = async function (req, res) {
    let task_id = req.params['task_id'] ?? '';
    if (task_id == '' || task_id == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task ID field is required." });
    else {
        let data = await TaskModel.getFullTaskInfo(task_id);
        if (data)
            res.status(httpCode.OK).json({ code: httpCode.OK, message: "Tasks Details.", data: data });
        else
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task ID." });
    }
}
