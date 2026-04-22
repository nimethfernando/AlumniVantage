const db = require('../config/db');

exports.getAlumniDirectory = async (req, res) => {
  try {
    const { programme, graduationYear, sector } = req.query;

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
      WHERE u.is_verified = 1 AND u.role = 'alumnus'
    `;

    const params = [];

    if (programme) {
      query += ` AND d.degree_name LIKE ?`;
      params.push(`%${programme}%`);
    }

    if (graduationYear) {
      query += ` AND YEAR(d.completion_date) = ?`;
      params.push(graduationYear);
    }

    if (sector) {
      query += ` AND eh.industry_sector = ?`;
      params.push(sector);
    }

    query += `
      GROUP BY u.id, u.email
      ORDER BY graduation_year DESC, u.id DESC
    `;

    const [rows] = await db.query(query, params);

    res.status(200).json({
      message: 'Alumni directory fetched successfully',
      alumni: rows
    });
  } catch (error) {
    console.error('Get alumni directory error:', error);
    res.status(500).json({ error: 'Failed to fetch alumni directory' });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    const [programmes] = await db.query(`
      SELECT DISTINCT degree_name
      FROM degrees
      WHERE degree_name IS NOT NULL
      ORDER BY degree_name ASC
    `);

    const [years] = await db.query(`
      SELECT DISTINCT YEAR(completion_date) AS year
      FROM degrees
      WHERE completion_date IS NOT NULL
      ORDER BY year DESC
    `);

    const [sectors] = await db.query(`
      SELECT DISTINCT industry_sector
      FROM employment_history
      WHERE industry_sector IS NOT NULL
      ORDER BY industry_sector ASC
    `);

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