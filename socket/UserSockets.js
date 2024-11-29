const SocketIo = require("socket.io");
const jwt = require('jsonwebtoken');
const Middleware = require("../middleware/socket.middleware");

function initUserSocket(server) {
    const io = SocketIo(server);
    io.use((socket,next)=>Middleware.authenticateUsers(socket,next))
    io.on("connection",(socket)=>{
        console.log(`A New user connected with Socket ID: ${socket.id}`);
        console.log(socket.decoded)
        io.emit('receive_date', "Thanks for joining with US.");
        // / Event listener for custom events
        socket.on('chat message', (msg) => {
            console.log(msg);
            // Broadcast the message to all connected clients
            io.emit('receive_message', msg);
            io.emit('receive_date', Date.now());
        });
    
        socket.on("disconnect",()=>{
            console.log(`User disconnected with Socket ID: ${socket.id}`);
        })
    });
}

module.exports = initUserSocket;