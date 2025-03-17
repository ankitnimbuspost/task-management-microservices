const SocketIo = require("socket.io");
const jwt = require('jsonwebtoken');
const Middleware = require("../middleware/socket.middleware");
const TaskModel = require("../models/task.model");
const redisClient = require("../config/redis.config")

const activeUsers = new Map(); 
let io;

function initUserSocket(server) {
    // const io = SocketIo(server);
    io = new SocketIo.Server(server, {
        cors: {
            origin: "*", // Allow React client
            methods: ["GET", "POST"]
        }
    });
    io.use((socket,next)=>Middleware.authenticateUsers(socket,next))
    ensureRedisConnected().then().catch((e)=>console.log(e.message));
    io.on("connection",async(socket)=>{
        console.log(`A New user connected with Socket ID: ${socket.id} and User ID: ${socket.decoded.id}`);
        if (!redisClient.isOpen) {
            await redisClient.connect(); // Ensure Redis is connected
        }
        await redisClient.sAdd(`socket_user:${socket.decoded.id}`, socket.id);

        //Start --------------- Get Task Details Event -------------------
        socket.on("task_details",(request)=>{
            let task_id = request.task_id ?? '';
            TaskModel.getFullTaskInfo(task_id).then((task)=>{
                socket.emit("get_task_details",{data:task});
            }).catch((err)=>{console.log(err.message)});
        });
        //End --------------- Get Task Details Event -------------------
        socket.on("join_task", async ({ task_id }) => {
            if (!task_id) return;
            try {
                if (socket.rooms.has(`room_task_${task_id}`)) {
                    console.log(`Socket ${socket.id} is already in room task_${task_id}`);
                    return; // Prevent unnecessary Re-Joins
                }
                const taskDetails = await TaskModel.getFullTaskInfo(task_id);
                if (taskDetails) {
                    socket.join(`room_task_${task_id}`);
                    console.log(`Socket ${socket.id} joined room task_${task_id}`);
                    socket.emit("task_details", { data: taskDetails });
                } else {
                    socket.emit("error", { message: "Task not found" });
                }
            } catch (error) {
                console.error(`Error fetching task ${task_id}:`, error.message);
                socket.emit("error", { message: "Failed to fetch task details" });
            }
        });

        // User leaves the task room
        socket.on("leave_task", ({ task_id }) => {
            if (!task_id) return;

            socket.leave(`task_${task_id}`); // Leave the room
            console.log(`Socket ${socket.id} left room task_${task_id}`);
        });

        //  Update Task and Broadcast to Room Members
        socket.on("update_task", async ({ task_id, new_data }) => {
            if (!task_id) return;

            try {
                await TaskModel.updateTask(task_id, new_data);
                const updatedTask = await TaskModel.getFullTaskInfo(task_id);

                // Broadcast update to all users in the room
                io.to(`room_task_${task_id}`).emit("task_updated", { data: updatedTask });

                console.log(`Task ${task_id} updated and broadcasted`);
            } catch (err) {
                console.log(err.message);
            }
        });
    
        socket.on("disconnect",async()=>{
            const userId = socket.decoded.id;
            if (!userId)
                return false;
            // Directly remove the socket ID from the user's set
            await redisClient.sRem(`socket_user:${userId}`, socket.id);
            const remainingSockets = await redisClient.sMembers(`socket_user:${userId}`);
            if (remainingSockets.length === 0) {
                await redisClient.del(`socket_user:${userId}`);
            }
            console.log(`User disconnected with Socket ID: ${socket.id}`);
        })
    });
    return io; 
}


async function ensureRedisConnected() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Connected to Redis");
    }
}

module.exports = { initUserSocket, activeUsers, getIo: () => io };
