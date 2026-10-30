
const express = require("express");
const { body, validationResult } = require("express-validator");

const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });
    }

    next();
};

// Registration
router.post(
    "/register",
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required.")
            .isLength({ max: 100 })
            .withMessage("Name cannot exceed 100 characters."),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Please enter a valid email address.")
            .isLength({ max: 255 })
            .withMessage("Email cannot exceed 255 characters."),

        body("password")
            .isString()
            .withMessage("Password must be a string.")
            .isLength({ min: 8, max: 72 })
            .withMessage("Password must be between 8 and 72 characters.")
    ],
    validateRequest,
    registerUser
);

// Login
router.post(
    "/login",
    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("Please enter a valid email address."),

        body("password")
            .isString()
            .notEmpty()
            .withMessage("Password is required.")
    ],
    validateRequest,
    loginUser
);

// Protected profile
router.get("/profile", protect, getProfile);

module.exports = router;
