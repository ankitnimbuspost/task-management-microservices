const { EventEmitter } = require("events");


const emitter = new EventEmitter();

emitter.on("task_activity", async (data) => {
    try {
        const TaskActivity = require("../models/taskActivity.model");
        await TaskActivity.create(data);
    } catch (error) {
        console.log(error.message);
    }
})

global.log = function (log_type, title, data) {
    let event_name = "";
    switch (log_type) {
        case "task_activity":
            event_name = "task_activity";
            break;

        default:
            break;
    }
    setImmediate(() => {
        emitter.emit(event_name, data);
    });
}