import express from "express";
import {
  createNotification,
  getAllNotifications,
  getNotificationsByUser,
  markAsRead,
  deleteNotification,
  getUnreadCount,   // ✅ new controller
} from "../controllers/notificationController.js";

const router = express.Router();

// Create a notification
router.post("/", createNotification);

// Get all notifications (admin use)
router.get("/", getAllNotifications);

// Get notifications for a specific user
router.get("/:userId", getNotificationsByUser);

// Get unread count for a specific user (badge)
router.get("/:userId/unread-count", getUnreadCount);  // ✅ new route

// Mark a notification as read
router.put("/:id/read", markAsRead);

// Delete a notification
router.delete("/:id", deleteNotification);

export default router;
