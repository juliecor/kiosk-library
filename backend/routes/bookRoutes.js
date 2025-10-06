// backend/routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth"); // protects routes
const bookController = require("../controllers/bookController");
const upload = require("../middleware/uploadMiddleware"); // <-- import multer middleware

// Public: list & view
router.get("/", bookController.getBooks);
router.get("/:id", bookController.getBookById);

// Protected: create, update, delete, restore
router.post(
  "/",
  authMiddleware,
  upload.single("image"), // <-- handle single image upload
  bookController.createBook
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"), // <-- allow updating image too
  bookController.updateBook
);

router.delete("/:id", authMiddleware, bookController.deleteBook);
router.post("/:id/restore", authMiddleware, bookController.restoreBook);

module.exports = router;
