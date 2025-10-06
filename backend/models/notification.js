const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["student", "admin"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientType", // Dynamically reference either Student or Admin
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false, // Unread by default
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
