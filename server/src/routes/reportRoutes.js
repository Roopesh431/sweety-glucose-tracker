
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getReports } = require("../controllers/reportController");

const router = express.Router();

// All reports require authentication.
router.use(protect);

// GET /api/reports?date=2026-10-30
router.get("/", getReports);

module.exports = router;
