
const { pool, query } = require("../config/db");
const {
    isValidDate,
    isFutureDate
} = require("../utils/dateUtils");

const VALID_SLOTS = [
    "morning",
    "after_breakfast",
    "after_lunch",
    "after_dinner"
];

const SLOT_LABELS = {
    morning: "Morning (fasting)",
    after_breakfast: "After breakfast",
    after_lunch: "After lunch",
    after_dinner: "After dinner"
};

// Validate reading input
const validateReading = (date, slot, value) => {
    if (value === undefined || value === null || value === "") {
        return "Please enter a glucose value.";
    }

    if (
        !Number.isInteger(value) ||
        value < 40 ||
        value > 600
    ) {
        return "Value must be between 40 and 600 mg/dl.";
    }

    if (!date || !isValidDate(date)) {
        return "Please enter a valid date.";
    }

    if (isFutureDate(date)) {
        return "Date cannot be in the future.";
    }

    if (!VALID_SLOTS.includes(slot)) {
        return "Please select a valid time slot.";
    }

    return null;
};

// CREATE READING
const createReading = async (req, res) => {
    const { date, time_slot, value } = req.body;
    const userId = req.user.id;

    const validationError = validateReading(
        date,
        time_slot,
        value
    );

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Serialize additions for the same user and date.
        await client.query(
            `SELECT pg_advisory_xact_lock(
                hashtextextended($1, 0)
            )`,
            [`${userId}:${date}`]
        );

        // Check daily reading limit
        const countResult = await client.query(
            `SELECT COUNT(*)::INTEGER AS total
             FROM glucose_readings
             WHERE user_id = $1 AND reading_date = $2`,
            [userId, date]
        );

        if (countResult.rows[0].total >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "You can add only 4 readings per day."
            });
        }

        // Insert reading
        const result = await client.query(
            `INSERT INTO glucose_readings
             (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, date, time_slot, value]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Glucose reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: `You already have an ${SLOT_LABELS[time_slot]} reading for this date.`
            });
        }

        console.error("Create reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to add glucose reading."
        });

    } finally {
        client.release();
    }
};


// GET ALL READINGS
const getReadings = async (req, res) => {
    try {
        const { date } = req.query;

        if (date && !isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid date."
            });
        }

        let sql = `
            SELECT id, reading_date, time_slot,
                   glucose_value, created_at, updated_at
            FROM glucose_readings
            WHERE user_id = $1
        `;

        const params = [req.user.id];

        if (date) {
            sql += " AND reading_date = $2";
            params.push(date);
        }

        sql += `
            ORDER BY reading_date DESC,
            CASE time_slot
                WHEN 'morning' THEN 1
                WHEN 'after_breakfast' THEN 2
                WHEN 'after_lunch' THEN 3
                WHEN 'after_dinner' THEN 4
            END ASC
        `;

        const result = await query(sql, params);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch readings."
        });
    }
};


// GET SINGLE READING
const getReadingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reading ID."
            });
        }

        const result = await query(
            `SELECT id, reading_date, time_slot,
                    glucose_value, created_at, updated_at
             FROM glucose_readings
             WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            success: true,
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Get reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch reading."
        });
    }
};


// UPDATE READING
const updateReading = async (req, res) => {
    const { id } = req.params;
    const { date, time_slot, value } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid reading ID."
        });
    }

    const validationError = validateReading(
        date,
        time_slot,
        value
    );

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock the target user's date.
        await client.query(
            `SELECT pg_advisory_xact_lock(
                hashtextextended($1, 0)
            )`,
            [`${req.user.id}:${date}`]
        );

        // Check that the reading belongs to this user.
        const existing = await client.query(
            `SELECT id
             FROM glucose_readings
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [id, req.user.id]
        );

        if (existing.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Reading not found."
            });
        }

        // Exclude the current reading from daily count.
        const countResult = await client.query(
            `SELECT COUNT(*)::INTEGER AS total
             FROM glucose_readings
             WHERE user_id = $1
               AND reading_date = $2
               AND id != $3`,
            [req.user.id, date, id]
        );

        if (countResult.rows[0].total >= 4) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "You can add only 4 readings per day."
            });
        }

        const result = await client.query(
            `UPDATE glucose_readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [date, time_slot, value, id, req.user.id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Glucose reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: `You already have an ${SLOT_LABELS[time_slot]} reading for this date.`
            });
        }

        console.error("Update reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update reading."
        });

    } finally {
        client.release();
    }
};


// DELETE READING
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reading ID."
            });
        }

        const result = await query(
            `DELETE FROM glucose_readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Glucose reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete reading."
        });
    }
};


module.exports = {
    createReading,
    getReadings,
    getReadingById,
    updateReading,
    deleteReading
};
