const db = require('../config/db');

exports.getDashboardAnalytics = async (req, res) => {
  try {

    const [skillsGap] = await db.query(`
      SELECT
        course_name AS subject,
        50 AS university,
        LEAST(COUNT(*) * 10, 100) AS alumni,
        100 AS fullMark
      FROM short_courses
      GROUP BY course_name
      LIMIT 6
    `);

    const [industryEmployment] = await db.query(`
      SELECT
        COALESCE(company, 'Unknown') AS name,
        COUNT(*) AS value
      FROM employment_history
      GROUP BY company
      ORDER BY value DESC
    `);

    const [employmentTrends] = await db.query(`
      SELECT
        YEAR(completion_date) AS year,
        COUNT(*) AS employed,
        COUNT(*) AS certified
      FROM degrees
      WHERE completion_date IS NOT NULL
      GROUP BY YEAR(completion_date)
      ORDER BY year ASC
    `);

    res.json({
      skillsGap,
      industryEmployment,
      employmentTrends
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
};