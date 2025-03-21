const httpCode = require("../../config/error.config");
const CommonHelper = require("../../helpers/common.helper");
const ProjectModel = require("../../models/project.model");
const MQService = require("../../services/RabbitMQ.service");
const { activeUsers, getIo } = require("../../socket/UserSockets"); // Import io and active users



// This Function Create or Update Project 
module.exports.addProject = async function (req, res) {
    let project_name = req.body['project_name'];
    let project_desc = req.body['project_desc'];
    let status = req.body['status'];
    if (project_name == '' || project_name == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Project Name field is required." });
    else if (project_desc == '' || project_desc == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Project Description field is required." });
    else {
        let current_user = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: req.user.id });
        let company_id = null;
        if (current_user)
            company_id = current_user.company_id;
        let user_not_found = '';
        let owners = [];
        //Now Check Project Owners from Task Microservices
        if (req.body['project_owners'] != undefined && req.body['project_owners'] != "") {
            if (typeof req.body['project_owners'] != "object")
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Project Owners accept only array format` });

            owners = [...new Set(req.body['project_owners'])];
            let data = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user: req.user.id, data: owners });
            // Now Check Task Owner ID one by one 
            owners.forEach(function (element, index) {
                if (data[`${element}`] == 0)
                    user_not_found += element + ", ";
            });
            if (user_not_found != '')
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Project Owners ${user_not_found} users` });
        }
        try {
            let project_id = '';
            if (req.body['id'] != undefined && req.body['id'] != "") {
                project_id = req.body['id'];
                // Check Project exists or not 
                let exists = await ProjectModel.countDocuments({ _id: project_id })
                if (!exists)
                    return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Project ID` });
            }
            let data = {
                "user_id": req.user.id,
                "company_id": company_id,
                "project_name": project_name,
                "project_desc": project_desc,
                "project_owners": owners,
                "status": status ? status : 1,
                "updated": Math.floor(Date.now() / 1000)
            }
            let save = '';
            let prev_data = {};
            if (project_id == '') {
                save = new ProjectModel(data);
                await save.save();
            }
            else {
                prev_data = await ProjectModel.findOne({ _id: project_id });
                save = await ProjectModel.findOneAndUpdate({ _id: project_id }, { "$set": data }, { new: true });
            }
            // Create Log 
            log("panel_log","PROJECT_CREATE_UPDATE",{
                prev_data: prev_data,
                current_data: save,
                user_id: req.user.id,
                action: "PROJECT_CREATE_UPDATE"
            });
            res.json({ code: httpCode.OK, message: `Project ${project_id == '' ? 'created' : 'Updated'} successfully.`, data: save })
        } catch (error) {
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": error.message });
        }
    }
}

//This Function Assign existing Project to User
module.exports.assignProject = async function (req, res) {
    let project_id = req.body['project_id'];
    let assigned_user_id = req.body['assigned_user_id'];

    if (project_id == '' || project_id == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Project ID field is required." });
    else if(!await ProjectModel.checkProjectExists(project_id))
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Project ID field is invalid." });
    else if (assigned_user_id == '' || assigned_user_id == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Assignee User ID field is required." });
    else {
        let project = await ProjectModel.findOne({_id:project_id});
        let owners = new Set(JSON.parse(JSON.stringify(project.project_owners)));
        if(owners.has(assigned_user_id))
            return res.status(httpCode.CONFLICT).json({ code: httpCode.CONFLICT, "message": "Project already assigned." });
        else{
            try {
                let data = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user: req.user.id, data: [assigned_user_id] });
                if(data[assigned_user_id]==0)
                    return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid User ID.` });
                owners.add(assigned_user_id);
                project.project_owners = Array.from(owners);
                await project.save();
                //Send the notification
                log("notification_log","NOTIFICATION",{
                    to_user_id:assigned_user_id,
                    message: `You have been assigned to project: ${project.project_name}`,
                    project_id,
                    sender_id:req.user.id,
                    action:"PROJECT_ASSIGNED"
                });
                res.status(httpCode.OK).json({code: httpCode.OK,message: "Project assigned successfully.",data: project});
            } catch (error) {
                console.log(error.message);
                res.status(httpCode.INTERNAL_SERVER_ERROR).json({code: httpCode.INTERNAL_SERVER_ERROR,message: "Something went wrong."});
            }
        }
    }
}

//Get Active Projects Listing
module.exports.getActiveProjects = async function (req, res) {
    let user_id = req.user.id;
    // let data = await ProjectModel.find({ project_owners: user_id, status: 1 }).select({ "project_name": 1, "project_desc": 1, "status": 1 });
    let projects = await ProjectModel.find({ project_owners: user_id,status: 1}).select({ "project_name": 1, "project_desc": 1, "status": 1,'created':1,'updated':1 }).lean();
    // Convert Timestapm to Proper Date 
    projects = projects.map((project,key) => ({
        ...project,
        created: CommonHelper.converToDate1(project.created),
        updated: CommonHelper.converToDate1(project.updated),
        id:key+1
    }));
    res.status(httpCode.OK).json({ code: httpCode.OK, message: "Project Listing.", data: projects });
}

//Get All Projects Listing
module.exports.getAllProjects = async function (req, res) {
    let current_user = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: req.user.id });
    let company_id = null;
    if (current_user)
        company_id = current_user.company_id;
    let projects = await ProjectModel.find({ company_id: company_id}).populate({ path: "project_owners", select: "f_name l_name" })
                    .select({ "project_name": 1, "project_desc": 1, "status": 1,'created':1,'updated':1 }).sort({ "_id": -1 }).lean();
    // Convert Timestapm to Proper Date 
    projects = projects.map((project,key) => ({
        ...project,
        created: CommonHelper.converToDate1(project.created),
        updated: CommonHelper.converToDate1(project.updated),
        id:key+1
    }));
    res.status(httpCode.OK).json({ code: httpCode.OK, message: "Project Listing.", data: projects });
}

//Get Singal project by project id
module.exports.getProject = async function(req,res){
    let {project_id} = req.params;
    if (!await ProjectModel.checkProjectExists({ _id: project_id }))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Project ID` });
    else{
        let project = await ProjectModel.findOne({_id:project_id});
        return res.status(httpCode.OK).json({ code: httpCode.OK, message: "Project Details.", data: project });
    }
}