
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
    createReading,
    getReadings,
    getReadingById,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

const router = express.Router();

// All reading endpoints require authentication.
router.use(protect);

router.post("/", createReading);
router.get("/", getReadings);
router.get("/:id", getReadingById);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

module.exports = router;
