const express = require("express");
const http = require("http");
require("dotenv").config();
require("./config/database.config");
require("./services/ApplicationLog");
// require("./config/rabbitmq.config");
const initUserSocket = require("./socket/UserSockets")
const apiRoutes = require("./routes/api.route");
const QueueController = require("./controllers/APIs/queue.controller")
const app = express();
const server = http.createServer(app);
const cors = require('cors');

initUserSocket(server)

app.use(express.json())
app.use(cors())
// Serve static files (e.g., index.html)
app.use(express.static(__dirname + '/public'));
app.get("/queue-run",QueueController.startQueue);
app.use("/api",apiRoutes);

server.listen(process.env.PORT,function(){
    console.log(`Application running on ${process.env.PORT} PORT`);
})
