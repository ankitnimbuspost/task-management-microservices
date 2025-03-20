const MQService = require("./RabbitMQ.service");
const httpCode = require("../config/error.config");
const TaskModel = require("../models/task.model");
const { template } = require("lodash");
module.exports =  class TaskServices {
    constructor() {
        console.log("Task Service Constructor call");
    }
    static async createTask(user_id,data) {
        //Now Check Project Owners from Task Microservices
        let owners = data.owners ?? null;
        if (owners && owners !== "") {
            try {
                const ownerValidation = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user:user_id, data: owners });
                const invalidOwners = owners.filter(owner => !ownerValidation[owner]);
                if (invalidOwners.length)
                    return {code:httpCode.BAD_REQUEST,message:`Invalid Task Owners: ${invalidOwners.join(", ")}` }
            } catch (error) {
                return {code:httpCode.INTERNAL_SERVER_ERROR,message:`Connection error, please contact support.` }
            }
        }
        if(data.reporter && data.reporter!=undefined){
            try {
                let reporter = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: data.reporter });
                if(!reporter)
                    return {code:httpCode.BAD_REQUEST,message:`Invalid Reporter ID.` }
            } catch (error) {
                return {code:httpCode.INTERNAL_SERVER_ERROR,message:`Connection error, please contact support.` }
            }
        }
        let task_id = null;
        let current_user = null;
        try {
            task_id = await MQService.getDataFromM1({ action: "GET_TASK_ID", login_user: user_id });
            current_user = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: user_id });
        } catch (error) {
            return {code:httpCode.INTERNAL_SERVER_ERROR,message:`Connection error, please contact support.` }
        }
        if (!task_id)
            return {code:httpCode.NOT_ACCEPTABLE,message:"KYC not completed. Please complete KYC."  }
        
        try {
            data.task_id = task_id;
            data.company_id = current_user?.company_id || null;
            let resp = await TaskModel.createTask(data);
            // Create Log 
            log("panel_log", "TASK_CREATE_UPDATE", {
                prev_data: {},
                current_data: resp,
                user_id: user_id,
                action: "TASK_CREATE_UPDATE"
            });
            // Send Assignee Email 
            this.sendEmail({});
            return {code:httpCode.OK,message:"Task created successfully.","data":resp  }
        } catch (error) {
            console.log(error)
            return {code:httpCode.INTERNAL_SERVER_ERROR,message:"Something went wrong, Please try again.","data":resp  }
        }
    }

    static async updateTask(user_id,task_id,data) {
        let prev_data = await TaskModel.findOne({ _id: task_id });
        let owners = data.owners ?? null;
        // Now Check Project Owners from Task Microservices
        if (owners && owners !== "") {
            try{
                const ownerValidation = await MQService.getDataFromM1({ action: "CHECK_USER_EXISTS", login_user: user_id, data: owners });
                const invalidOwners = owners.filter(owner => !ownerValidation[owner]);
                if (invalidOwners.length)
                    return {code:httpCode.BAD_REQUEST,message:`Invalid Task Owners: ${invalidOwners.join(", ")}` }
            } catch (error) {
                return {code:httpCode.INTERNAL_SERVER_ERROR,message:`Connection error, please contact support.` }
            }
        }
        if(data.reporter && data.reporter!=undefined){
            try {
                let reporter = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: data.reporter });
                if(!reporter)
                    return {code:httpCode.BAD_REQUEST,message:`Invalid Reporter ID.` }
            } catch (error) {
                return {code:httpCode.INTERNAL_SERVER_ERROR,message:`Connection error, please contact support.` }
            }
        }
        if (data.task_status){
            // now create activity log for task status 
            if(prev_data.task_status!=data.task_status){
                log("task_activity","Task Update",{
                    task_id: task_id,
                    before: prev_data.task_status,
                    after: data.task_status,
                    added_by: user_id,
                    update_subject:"status"
                });
            }
        }
        if(data.task_name){
            // now create activity log for task summary 
            if(data.task_name!=prev_data.task_name){
                log("task_activity","Task Update",{
                    task_id: task_id,
                    before: prev_data.task_name,
                    after: data.task_name,
                    added_by: user_id,
                    update_subject:"summary"
                });
            }
        }
        if(data.task_desc){
            // now create activity log for task description 
            if(data.task_desc!=prev_data.task_desc){
                log("task_activity","Task Update",{
                    task_id: task_id,
                    before: prev_data.task_desc,
                    after: data.task_desc,
                    added_by: user_id,
                    update_subject:"description"
                });
            }
        }
        let resp = await TaskModel.findOneAndUpdate({ _id: task_id }, { "$set": data }, { new: true });
        // Create Log 
        log("panel_log","TASK_CREATE_UPDATE",{
            prev_data: prev_data,
            current_data: resp,
            user_id: user_id,
            action: "TASK_CREATE_UPDATE"
        });
        // Send Assignee Email 
        this.sendEmail("assignee",user_id,resp).then((data)=>console.log(data)).catch((err)=>console.log(err));
        return {code:httpCode.OK,message:"Task updated successfully.","data":resp  }
    }

    static async sendEmail(type,user_id,data = {}) {
        if(!type || !user_id)
            return false;
        
        let current_user = null;
        let template = null;
        let to_email = null;
        let subject = '';
        let content = {};
        try {
            current_user = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: user_id });
            console.log(current_user)
            if(!current_user)
                throw new Error("User not found");
        } catch (error) {
            throw new Error(`Internal Error:  `+error.message)
        }
        try {
            switch (type.toLowerCase()) {
                case "assignee":
                    template = "task-assignee-email";
                    to_email = current_user.email;
                    let reporter = await MQService.getDataFromM1({ action: "GET_USER_DETAILS", login_user: data.reporter.toString() });
                    if(!reporter)
                        throw new Error("Reporter User not found");
                    console.log(data)
                    content = {
                        reporter: reporter.f_name+" "+reporter.l_name,
                        task_id: data.task_id,
                        task_type: data.task_type,
                    }
                    subject = `[${process.env.SHORT_APP_NAME}] Ankit Kumar Thakur assigned NP-412 to you`;
                    break;
            
                default:
                    break;
            }


            const EmailServices = require("./EmailServices");
            const email = new EmailServices();
            email.setTo("ankit.t@nimbuspost.com");
            // email.setTo(to_email);
            email.setSubject(subject);
            email.setTemplate(template);
            email.setData(data);
            // email.sendEmail().then(()=>console.log("Mail Sent")).catach((err)=>console.log(err));
        } catch (error) {
            console.log(error)
        }
        console.log("success")
    }
}