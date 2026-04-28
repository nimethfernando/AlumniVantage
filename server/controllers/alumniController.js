// server/controllers/alumniController.js
const db = require('../config/db'); // Import DB connection pool

// --- GET ALUMNI DIRECTORY ---
// Fetches the list of alumni based on optional search filters
exports.getAlumniDirectory = async (req, res) => {
  try {
    const { programme, graduationYear, sector } = req.query; // Extract filter params from URL

    // Build the base SQL query
    // We use MAX() and GROUP BY to ensure we only get ONE row per user, 
    // even if they have multiple degrees or job records.
    let query = `
      SELECT
        u.id AS user_id,
        u.email,
        MAX(p.first_name) AS first_name,
        MAX(p.last_name) AS last_name,
        MAX(p.bio) AS bio,
        MAX(p.linkedin_url) AS linkedin_url,
        MAX(p.profile_image_url) AS profile_image_url,
        MAX(d.degree_name) AS degree_name,
        MAX(YEAR(d.completion_date)) AS graduation_year,
        MAX(eh.company) AS company,
        MAX(eh.role) AS job_title,
        MAX(eh.industry_sector) AS industry_sector,
        MAX(eh.location) AS location
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      WHERE u.is_verified = 1 AND u.role = 'alumnus' -- Only show verified alumni profiles
    `;

    const params = []; // Array to hold parameterized values preventing SQL injection

    // --- DYNAMIC FILTERING ---
    if (programme) {
      query += ` AND d.degree_name LIKE ?`; // LIKE allows for partial string matching
      params.push(`%${programme}%`);
    }

    if (graduationYear) {
      query += ` AND YEAR(d.completion_date) = ?`; // Exact match on extracted year
      params.push(graduationYear);
    }

    if (sector) {
      query += ` AND eh.industry_sector = ?`; // Exact match on industry sector
      params.push(sector);
    }

    // Collapse the joins into single records per user and sort newest grads first
    query += `
      GROUP BY u.id, u.email
      ORDER BY graduation_year DESC, u.id DESC
    `;

    const [rows] = await db.query(query, params); // Execute the finalized dynamic query

    res.status(200).json({
      message: 'Alumni directory fetched successfully',
      alumni: rows // Return the array of aggregated user objects
    });
  } catch (error) {
    console.error('Get alumni directory error:', error);
    res.status(500).json({ error: 'Failed to fetch alumni directory' });
  }
};

// --- GET FILTER OPTIONS ---
// Fetches the distinct values available in the database to populate the frontend dropdown menus
exports.getFilterOptions = async (req, res) => {
  try {
    // 1. Get unique degree names
    const [programmes] = await db.query(`
      SELECT DISTINCT degree_name
      FROM degrees
      WHERE degree_name IS NOT NULL
      ORDER BY degree_name ASC
    `);

    // 2. Get unique graduation years from completion dates
    const [years] = await db.query(`
      SELECT DISTINCT YEAR(completion_date) AS year
      FROM degrees
      WHERE completion_date IS NOT NULL
      ORDER BY year DESC
    `);

    // 3. Get unique industry sectors
    const [sectors] = await db.query(`
      SELECT DISTINCT industry_sector
      FROM employment_history
      WHERE industry_sector IS NOT NULL
      ORDER BY industry_sector ASC
    `);

    // Map the raw database rows into flat arrays for the frontend UI
    res.status(200).json({
      programmes: programmes.map(p => p.degree_name),
      graduationYears: years.map(y => y.year),
      sectors: sectors.map(s => s.industry_sector)
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};