const express = require("express");
const route = express.Router();
const APIMiddleware = require("../middleware/api.middleware");
const QueueController = require("../controllers/APIs/queue.controller");
const TaskController = require("../controllers/APIs/task.controller")
const TaskCommentController = require("../controllers/APIs/task-comment.controller")
route.use("/",APIMiddleware.checkJWTToken);

route.get("/test",QueueController.test);
route.post("/create-project",TaskController.addProject);
route.post("/create-task",TaskController.createTask);
route.post("/update-task",TaskController.updateTask);
route.get("/get-task-status",TaskController.getTaskStatus);
route.get("/get-projects",TaskController.getProjects);
route.post("/assign-project",TaskController.assignProject);
route.post("/get-task-list",TaskController.getTaskList);
route.get("/get-task/:task_id",TaskController.getSingalTask);
route.post("/task-comment-create-update",TaskCommentController.commentCreateUpdate);
route.post("/get-task-comment",TaskCommentController.getCommentByTask);
route.get("/delete-task-comment/:task_id/:comment_id",TaskCommentController.deleteTaskComment);
module.exports = route;