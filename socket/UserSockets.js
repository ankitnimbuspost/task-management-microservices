const SocketIo = require("socket.io");
const jwt = require('jsonwebtoken');
const Middleware = require("../middleware/socket.middleware");
const TaskModel = require("../models/task.model");


function initUserSocket(server) {
    // const io = SocketIo(server);
    const io = new SocketIo.Server(server, {
        cors: {
            origin: "*", // Allow React client
            methods: ["GET", "POST"]
        }
    });
    io.use((socket,next)=>Middleware.authenticateUsers(socket,next))
    io.on("connection",(socket)=>{
        console.log(`A New user connected with Socket ID: ${socket.id}`);
        //Start --------------- Get Task Details Event -------------------
        socket.on("get_task_details",(request)=>{
            let task_id = request.task_id ?? '';
            TaskModel.getFullTaskInfo(task_id).then((task)=>{
                socket.emit("get_task_details",{data:task});
            }).catch((err)=>{console.log(err.message)});
        });
        //End --------------- Get Task Details Event -------------------
        socket.on("join_task", async ({ task_id }) => {
            if (!task_id) return;
            try {
                const taskDetails = await TaskModel.getFullTaskInfo(task_id);
                // If task exists, join the room and send task details
                if (taskDetails) {
                    socket.join(`task_${task_id}`);
                    console.log(`Socket ${socket.id} joined room task_${task_id}`);
                    // Send task details to the user who joined
                    socket.emit("task_details", { data: taskDetails });
                } else {
                    socket.emit("error", { message: "Task not found" });
                }
            } catch (error) {
                console.error(`Error fetching task ${task_id}:`, error.message);
                socket.emit("error", { message: "Failed to fetch task details" });
            }
        });

        // 🔴 User leaves the task room
        socket.on("leave_task", ({ task_id }) => {
            if (!task_id) return;

            socket.leave(`task_${task_id}`); // Leave the room
            console.log(`Socket ${socket.id} left room task_${task_id}`);
        });

        // 🔄 Update Task and Broadcast to Room Members
        socket.on("update_task", async ({ task_id, new_data }) => {
            if (!task_id) return;

            try {
                // Assume TaskModel updates the task in DB
                await TaskModel.updateTask(task_id, new_data);
                const updatedTask = await TaskModel.getFullTaskInfo(task_id);

                // Broadcast update to all users in the room
                io.to(`task_${task_id}`).emit("task_updated", { data: updatedTask });

                console.log(`Task ${task_id} updated and broadcasted`);
            } catch (err) {
                console.log(err.message);
            }
        });
    
        socket.on("disconnect",()=>{
            console.log(`User disconnected with Socket ID: ${socket.id}`);
        })
    });
}

module.exports = initUserSocket;