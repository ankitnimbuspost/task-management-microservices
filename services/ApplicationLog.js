const { EventEmitter } = require("events");
const SocketHandler = require("../services/SocketHandler");

const emitter = new EventEmitter();

// Task Activity Listern Here 
emitter.on("task_activity", async (data) => {
    try {
        const TaskActivity = require("../models/taskActivity.model");
        await TaskActivity.create(data);
        await SocketHandler.notifyTaskUpdate({task_id:data.task_id,section:"information"});
    } catch (error) {
        console.log(error.message);
    }
});

//Create Panel log Listern Here
emitter.on("panel_log", async (data) => {
    try {
        const PanelLog = require("../models/logs.model");
        await PanelLog.createLog(data);
    } catch (error) {
        console.log(error.message);
    }
});

//Notify Users to task update
emitter.on("task_update_notify", async (data) => {
    try {
        await SocketHandler.notifyTaskUpdate(data)
    } catch (error) {
        console.log(error.message);
    }
});

//Create Panel log Listern Here
emitter.on("notification_log", async (data) => {
    try {
        const { activeUsers, getIo } = require("../socket/UserSockets");
        const Notification = require("../models/notification.model");
        // Save Notification to DB 
        await Notification.create({
            user_id: data.to_user_id || null,                 //(who receives this notification)
            project_id: data.project_id || null,
            task_id : data.task_id || null,
            message: data.message || '',
            type:data.action || '',
            sender_id: data.sender_id || null,           // Who triggered the notification?

        });
        // Send Notification to User Via WebSocket
        activeUsers.set(data.to_user_id, data.to_user_id);
        const io = getIo();
        const user_socket_id = activeUsers.get(data.to_user_id);
        if (user_socket_id) {
            io.to(user_socket_id).emit("notification", {
                message: data.message,
                project_id: data.project_id
            });
            console.log(`Notification sent to user ${data.to_user_id}`);
        }
    } catch (error) {
        console.log(error.message);
    }
});

global.log = function (log_type, title, data) {
    let event_name = "";
    switch (log_type) {
        case "task_activity":
            event_name = "task_activity";
            break;
        case "panel_log":
            event_name = "panel_log";
            break;
        case "notification_log":
            event_name = "notification_log";
            break;
        case "task_update_notify":
            event_name = "task_update_notify";
            break;
        default:
            break;
    }
    setImmediate(() => {
        emitter.emit(event_name, data);
    });
}