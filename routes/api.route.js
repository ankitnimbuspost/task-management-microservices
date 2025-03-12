const express = require("express");
const route = express.Router();
const APIMiddleware = require("../middleware/api.middleware");
const QueueController = require("../controllers/APIs/queue.controller");
const TaskController = require("../controllers/APIs/task.controller")
const TaskCommentController = require("../controllers/APIs/task-comment.controller")
const ProjecController = require("../controllers/APIs/project.controller");
const TaskActivityController = require("../controllers/APIs/task-activity.controller");
route.use("/",APIMiddleware.checkJWTToken);

route.get("/test",QueueController.test);
route.post("/create-update-project",ProjecController.addProject);
route.get("/get-project/:project_id",ProjecController.getProject);
route.post("/assign-project",ProjecController.assignProject);
route.get("/get-active-projects",ProjecController.getActiveProjects);
route.get("/get-all-projects",ProjecController.getAllProjects);

route.get("/get-task-history/:task_id",TaskActivityController.getTaskHistory);

route.post("/create-task",TaskController.createTask);
route.post("/update-task",TaskController.updateTask);
route.get("/get-task-status",TaskController.getTaskStatus);
route.post("/get-task-list",TaskController.getTaskList);
route.get("/get-task/:task_id",TaskController.getSingalTask);
route.post("/task-comment-create-update",TaskCommentController.commentCreateUpdate);
route.get("/get-task-comment/:task_id",TaskCommentController.getCommentByTask);
route.get("/delete-task-comment/:task_id/:comment_id",TaskCommentController.deleteTaskComment);
module.exports = route;