const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyApiKey = require('../middleware/verifyApikey');

router.get('/featured-alumnus', verifyApiKey, async (req, res) => {
    try {
        // Find the profile of the user who is in the featured_profiles table
        // We order by won_date DESC to get the most recent winner
        const [rows] = await pool.execute(`
            SELECT p.* FROM profiles p
            JOIN featured_profiles fp ON p.user_id = fp.user_id
            ORDER BY fp.won_date DESC
            LIMIT 1
        `);
        
        if (rows.length === 0) {
            return res.json({ message: "No featured alumnus selected for today." });
        }

        res.json({ featured_alumnus: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching featured alumnus" });
    }
});

module.exports = router;