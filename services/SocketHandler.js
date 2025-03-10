const {getIo,activeUsers} = require("../socket/UserSockets");

module.exports.notifyTaskUpdate = async function(data){
    let io = getIo();
    try {
        if (io) {
            //Section May Be (information,comment)
            const TaskModel = require("../models/task.model");
            const updatedTask = await TaskModel.getFullTaskInfo(data.task_id);
            io.to(`room_task_${data.task_id}`).emit("task_updated", { data: updatedTask,update_section:data.section }); // Emit to all users in the task room
            console.log("Updated socket task");
            return true;
        } else {
            console.error("Socket.IO instance is not available");
            return false;
        }
    } catch (error) {
        console.log(error.message);
        return false;
    }
    
}