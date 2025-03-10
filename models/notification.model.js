const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["PROJECT_ASSIGNED","TASK_ASSIGNED","TASK_UPDATED","NEW_COMMENT","MENTION","PROJECT_DEADLINE","TASK_OVERDUE"],
      required: true,
      index: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "projects",
      default: null, // Optional, only for project-related notifications
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tasks",
      default: null, // Optional, only for task-related notifications
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true, // Who triggered the notification?
    },
    message: {
      type: String,
      required: true, // Custom message for frontend
    },
    is_read: {
      type: Boolean,
      default: false, // Mark read/unread
    },
    created: {
      type: Date,
      default:Math.floor(Date.now()/1000),
    },
  },
);

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;
