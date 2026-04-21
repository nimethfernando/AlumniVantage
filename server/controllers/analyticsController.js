const db = require('../config/db');

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const programme = req.query.programme || null;
    const graduationYear = req.query.graduationYear || null;
    const sector = req.query.sector || null;

    const conditions = ['u.is_verified = 1'];
    const params = [];

    if (programme) {
      conditions.push('d.degree_name LIKE ?');
      params.push(`%${programme}%`);
    }

    if (graduationYear) {
      conditions.push('YEAR(d.completion_date) = ?');
      params.push(graduationYear);
    }

    if (sector) {
      conditions.push('eh.industry_sector = ?');
      params.push(sector);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [skillsRaw] = await db.query(`
      SELECT
        sc.course_name AS subject,
        LEAST(COUNT(*) * 10, 100) AS alumni,
        100 AS fullMark
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN short_courses sc ON sc.user_id = u.id
      ${whereClause}
      AND sc.course_name IS NOT NULL
      GROUP BY sc.course_name
      ORDER BY alumni DESC
      LIMIT 6
    `, params);

    const universitySkills = {
      'Cyber Security': 90,
      'Advanced Server-Side Web Programming': 95,
      'Concurrent Programming': 88,
      'Database Systems': 85,
      'Software Engineering': 80,
      'Web Development': 82,
      'Java Programming': 78,
      'Networking': 75,
      'Python': 72,
      'Cloud Computing': 35,
      'Docker': 15,
      'Kubernetes': 10,
      'AWS': 20,
      'Azure': 18,
      'Scrum': 25
    };

    const skillsGap = skillsRaw.map((item) => ({
      subject: item.subject,
      university: universitySkills[item.subject] || 30,
      alumni: item.alumni,
      fullMark: item.fullMark
    }));

    const [industryEmployment] = await db.query(`
      SELECT
        COALESCE(eh.industry_sector, 'Unknown') AS name,
        COUNT(*) AS value
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY value DESC
      LIMIT 8
    `, params);

    const [employmentTrends] = await db.query(`
      SELECT
        YEAR(d.completion_date) AS year,
        COUNT(DISTINCT eh.user_id) AS employed,
        COUNT(DISTINCT c.user_id) AS certified
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND d.completion_date IS NOT NULL
      GROUP BY YEAR(d.completion_date)
      ORDER BY year ASC
    `, params);

    const [topEmployers] = await db.query(`
      SELECT
        COALESCE(eh.company, 'Unknown') AS employer,
        COUNT(*) AS alumni_count
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND eh.company IS NOT NULL
      GROUP BY eh.company
      ORDER BY alumni_count DESC
      LIMIT 10
    `, params);

    const [certificationsByCategory] = await db.query(`
      SELECT
        CASE
          WHEN LOWER(c.name) LIKE '%aws%' OR LOWER(c.name) LIKE '%azure%' OR LOWER(c.name) LIKE '%gcp%' THEN 'Cloud'
          WHEN LOWER(c.name) LIKE '%security%' OR LOWER(c.name) LIKE '%cyber%' THEN 'Security'
          WHEN LOWER(c.name) LIKE '%scrum%' OR LOWER(c.name) LIKE '%agile%' THEN 'Project Management'
          WHEN LOWER(c.name) LIKE '%python%' OR LOWER(c.name) LIKE '%sql%' OR LOWER(c.name) LIKE '%data%' OR LOWER(c.name) LIKE '%tableau%' THEN 'Data'
          ELSE 'Other'
        END AS category,
        COUNT(*) AS value
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND c.name IS NOT NULL
      GROUP BY category
      ORDER BY value DESC
    `, params);

    const [alumniByGraduationYear] = await db.query(`
      SELECT
        YEAR(d.completion_date) AS year,
        COUNT(DISTINCT d.user_id) AS total
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND d.completion_date IS NOT NULL
      GROUP BY YEAR(d.completion_date)
      ORDER BY year ASC
    `, params);

    const [sectorDemand] = await db.query(`
      SELECT
        COALESCE(eh.industry_sector, 'Unknown') AS sector,
        COUNT(*) AS value
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY value DESC
      LIMIT 10
    `, params);

    const [coursesPopularity] = await db.query(`
      SELECT
        sc.course_name AS subject,
        COUNT(*) AS value
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN short_courses sc ON sc.user_id = u.id
      ${whereClause}
      AND sc.course_name IS NOT NULL
      GROUP BY sc.course_name
      ORDER BY value DESC
      LIMIT 8
    `, params);

    const [alumniCountResult] = await db.query(`
      SELECT COUNT(DISTINCT u.id) AS count
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND d.completion_date IS NOT NULL
    `, params);

    const [certificationCountResult] = await db.query(`
      SELECT COUNT(c.id) AS count
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND c.id IS NOT NULL
    `, params);

    const [topIndustryResult] = await db.query(`
      SELECT COALESCE(eh.industry_sector, 'N/A') AS sector, COUNT(*) AS count
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY count DESC
      LIMIT 1
    `, params);

    const totalAlumni = alumniCountResult[0]?.count || 0;
    const totalCertifications = certificationCountResult[0]?.count || 0;
    const topIndustry = topIndustryResult.length > 0 ? topIndustryResult[0].sector : 'N/A';

    res.json({
      skillsGap,
      industryEmployment,
      employmentTrends,
      topEmployers,
      certificationsByCategory,
      alumniByGraduationYear,
      sectorDemand,
      coursesPopularity,
      summaryMetrics: {
        totalAlumni,
        totalCertifications,
        topIndustry
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
};