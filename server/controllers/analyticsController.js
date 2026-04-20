const db = require('../config/db');

exports.getDashboardAnalytics = async (req, res) => {
  try {
    // These can be used to add WHERE clauses to the queries below if needed
    const programme = req.query.programme || null;
    const graduationYear = req.query.graduationYear || null;
    const sector = req.query.sector || null;

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
      LIMIT 8
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

    const [topEmployers] = await db.query(`
      SELECT
        COALESCE(company, 'Unknown') AS employer,
        COUNT(*) AS alumni_count
      FROM employment_history
      GROUP BY company
      ORDER BY alumni_count DESC
      LIMIT 10
    `);

    const [certificationsByCategory] = await db.query(`
      SELECT
        CASE
          WHEN LOWER(name) LIKE '%aws%' OR LOWER(name) LIKE '%azure%' OR LOWER(name) LIKE '%gcp%' THEN 'Cloud'
          WHEN LOWER(name) LIKE '%security%' OR LOWER(name) LIKE '%cyber%' THEN 'Security'
          WHEN LOWER(name) LIKE '%scrum%' OR LOWER(name) LIKE '%agile%' THEN 'Project Management'
          WHEN LOWER(name) LIKE '%python%' OR LOWER(name) LIKE '%sql%' OR LOWER(name) LIKE '%data%' THEN 'Data'
          ELSE 'Other'
        END AS category,
        COUNT(*) AS value
      FROM certifications
      GROUP BY category
      ORDER BY value DESC
    `);

    const [alumniByGraduationYear] = await db.query(`
      SELECT
        YEAR(completion_date) AS year,
        COUNT(*) AS total
      FROM degrees
      WHERE completion_date IS NOT NULL
      GROUP BY YEAR(completion_date)
      ORDER BY year ASC
    `);

    const [sectorDemand] = await db.query(`
      SELECT
        COALESCE(role, 'Unknown') AS sector,
        COUNT(*) AS value
      FROM employment_history
      GROUP BY role
      ORDER BY value DESC
      LIMIT 10
    `);

    const [coursesPopularity] = await db.query(`
      SELECT
        course_name AS subject,
        COUNT(*) AS value
      FROM short_courses
      GROUP BY course_name
      ORDER BY value DESC
      LIMIT 8
    `);

    res.json({
      skillsGap,
      industryEmployment,
      employmentTrends,
      topEmployers,
      certificationsByCategory,
      alumniByGraduationYear,
      sectorDemand,
      coursesPopularity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
};