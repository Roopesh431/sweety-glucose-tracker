
const { query } = require("../config/db");
const { getTodayIST, isValidDate } = require("../utils/dateUtils");

// Calculate previous month's date range
const getPreviousMonthRange = (selectedDate) => {
    const [year, month] = selectedDate.split("-").map(Number);

    const previousMonthDate = new Date(
        Date.UTC(year, month - 2, 1)
    );

    const previousMonthYear = previousMonthDate.getUTCFullYear();
    const previousMonth = previousMonthDate.getUTCMonth() + 1;

    const startDate = `${previousMonthYear}-${String(previousMonth).padStart(2, "0")}-01`;

    const lastDay = new Date(
        Date.UTC(year, month - 1, 0)
    ).getUTCDate();

    const endDate = `${previousMonthYear}-${String(previousMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return { startDate, endDate };
};

// Calculate glucose statistics
const calculateStats = (readings) => {
    if (readings.length === 0) {
        return {
            highest: null,
            lowest: null,
            average: null,
            count: 0
        };
    }

    const values = readings.map(
        reading => Number(reading.glucose_value)
    );

    return {
        highest: Math.max(...values),
        lowest: Math.min(...values),
        average: Number(
            (
                values.reduce((sum, value) => sum + value, 0) /
                values.length
            ).toFixed(1)
        ),
        count: readings.length
    };
};

// GET ALL REPORTS
const getReports = async (req, res) => {
    try {
        const selectedDate = req.query.date || getTodayIST();

        // Validate selected date
        if (!isValidDate(selectedDate)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid report date."
            });
        }

        if (selectedDate > getTodayIST()) {
            return res.status(400).json({
                success: false,
                message: "Report date cannot be in the future."
            });
        }

        const [year, month] = selectedDate.split("-");
        const monthStart = `${year}-${month}-01`;

        const { startDate, endDate } =
            getPreviousMonthRange(selectedDate);

        // Fetch current month's readings for this user.
        // TO_CHAR ensures PostgreSQL returns date-only strings.
        const result = await query(
            `SELECT
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value
             FROM glucose_readings
             WHERE user_id = $1
               AND reading_date BETWEEN $2 AND $3
             ORDER BY reading_date ASC,
             CASE time_slot
                WHEN 'morning' THEN 1
                WHEN 'after_breakfast' THEN 2
                WHEN 'after_lunch' THEN 3
                WHEN 'after_dinner' THEN 4
             END ASC`,
            [req.user.id, monthStart, selectedDate]
        );

        const readings = result.rows;

        // Daily readings
        const dailyReadings = readings.filter(
            reading => reading.reading_date === selectedDate
        );

        // Month-to-date readings
        const monthToDateReadings = readings.filter(
            reading =>
                reading.reading_date >= monthStart &&
                reading.reading_date <= selectedDate
        );

        // Fetch previous month's readings
        const previousMonthResult = await query(
            `SELECT
                id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                time_slot,
                glucose_value
             FROM glucose_readings
             WHERE user_id = $1
               AND reading_date BETWEEN $2 AND $3
             ORDER BY reading_date ASC`,
            [req.user.id, startDate, endDate]
        );

        const previousMonthReadings = previousMonthResult.rows;

        // Return all reports
        return res.status(200).json({
            success: true,
            selectedDate,

            daily: {
                date: selectedDate,
                ...calculateStats(dailyReadings),
                readings: dailyReadings
            },

            monthToDate: {
                startDate: monthStart,
                endDate: selectedDate,
                ...calculateStats(monthToDateReadings)
            },

            monthly: {
                startDate,
                endDate,
                ...calculateStats(previousMonthReadings)
            }
        });

    } catch (error) {
        console.error("Report generation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate reports."
        });
    }
};

module.exports = {
    getReports
};
