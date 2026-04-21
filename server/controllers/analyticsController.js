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
        skill,
        MAX(curriculum_value) AS curriculum,
        LEAST(COUNT(*) * 10, 100) AS alumni,
        100 AS fullMark
      FROM (
        SELECT 'Docker' AS skill, 15 AS curriculum_value
        UNION ALL
        SELECT 'Kubernetes', 10
        UNION ALL
        SELECT 'Cloud', 35
        UNION ALL
        SELECT 'Data Analytics', 30
        UNION ALL
        SELECT 'Agile', 25
        UNION ALL
        SELECT 'Cybersecurity', 60
      ) skill_base
      LEFT JOIN users u ON u.is_verified = 1
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      LEFT JOIN short_courses sc ON sc.user_id = u.id
      ${whereClause}
      AND (
        (skill_base.skill = 'Docker' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%docker%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%docker%'
        )) OR
        (skill_base.skill = 'Kubernetes' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%kubernetes%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%kubernetes%'
        )) OR
        (skill_base.skill = 'Cloud' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%aws%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%azure%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%gcp%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%google cloud%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%aws%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%azure%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%gcp%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%google cloud%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%cloud%'
        )) OR
        (skill_base.skill = 'Data Analytics' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%data%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%sql%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%tableau%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%python%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%data%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%sql%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%tableau%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%python%'
        )) OR
        (skill_base.skill = 'Agile' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%agile%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%scrum%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%agile%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%scrum%'
        )) OR
        (skill_base.skill = 'Cybersecurity' AND (
          LOWER(COALESCE(c.name, '')) LIKE '%security%' OR
          LOWER(COALESCE(c.name, '')) LIKE '%cyber%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%security%' OR
          LOWER(COALESCE(sc.course_name, '')) LIKE '%cyber%'
        ))
      )
      GROUP BY skill
      ORDER BY FIELD(skill, 'Docker', 'Kubernetes', 'Cloud', 'Data Analytics', 'Agile', 'Cybersecurity')
    `, params);

    const skillOrder = ['Docker', 'Kubernetes', 'Cloud', 'Data Analytics', 'Agile', 'Cybersecurity'];
    const curriculumMap = {
      Docker: 15,
      Kubernetes: 10,
      Cloud: 35,
      'Data Analytics': 30,
      Agile: 25,
      Cybersecurity: 60
    };

    const skillsGap = skillOrder.map((skill) => {
      const found = skillsRaw.find((item) => item.skill === skill);
      return {
        subject: skill,
        university: curriculumMap[skill],
        alumni: found ? Number(found.alumni) : 0,
        fullMark: 100
      };
    });

    const currentJobFilterSql = `
      FROM (
        SELECT eh.user_id, eh.company, eh.role, eh.industry_sector, eh.location, eh.start_date, eh.end_date
        FROM employment_history eh
        INNER JOIN (
          SELECT user_id, MAX(start_date) AS latest_start_date
          FROM employment_history
          WHERE end_date IS NULL OR end_date >= CURDATE()
          GROUP BY user_id
        ) latest_job
          ON eh.user_id = latest_job.user_id
          AND eh.start_date = latest_job.latest_start_date
        WHERE eh.end_date IS NULL OR eh.end_date >= CURDATE()
      ) current_jobs
      INNER JOIN users u ON u.id = current_jobs.user_id
      LEFT JOIN degrees d ON d.user_id = u.id
      WHERE u.is_verified = 1
      ${programme ? 'AND d.degree_name LIKE ?' : ''}
      ${graduationYear ? 'AND YEAR(d.completion_date) = ?' : ''}
      ${sector ? 'AND current_jobs.industry_sector = ?' : ''}
    `;

    const currentJobParams = [
      ...(programme ? [`%${programme}%`] : []),
      ...(graduationYear ? [graduationYear] : []),
      ...(sector ? [sector] : [])
    ];

    const [industryEmployment] = await db.query(`
      SELECT
        COALESCE(current_jobs.industry_sector, 'Unknown') AS name,
        COUNT(DISTINCT current_jobs.user_id) AS value
      ${currentJobFilterSql}
      AND current_jobs.industry_sector IS NOT NULL
      GROUP BY current_jobs.industry_sector
      ORDER BY value DESC
      LIMIT 8
    `, currentJobParams);

    const [jobTitles] = await db.query(`
      SELECT
        COALESCE(current_jobs.role, 'Unknown') AS name,
        COUNT(DISTINCT current_jobs.user_id) AS value
      ${currentJobFilterSql}
      AND current_jobs.role IS NOT NULL
      GROUP BY current_jobs.role
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    const [topEmployers] = await db.query(`
      SELECT
        COALESCE(current_jobs.company, 'Unknown') AS employer,
        COUNT(DISTINCT current_jobs.user_id) AS alumni_count
      ${currentJobFilterSql}
      AND current_jobs.company IS NOT NULL
      GROUP BY current_jobs.company
      ORDER BY alumni_count DESC
      LIMIT 10
    `, currentJobParams);

    const [locationDistribution] = await db.query(`
      SELECT
        COALESCE(current_jobs.location, 'Unknown') AS location,
        COUNT(DISTINCT current_jobs.user_id) AS value
      ${currentJobFilterSql}
      AND current_jobs.location IS NOT NULL
      GROUP BY current_jobs.location
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    const [sectorDemand] = await db.query(`
      SELECT
        COALESCE(current_jobs.industry_sector, 'Unknown') AS sector,
        COUNT(DISTINCT current_jobs.user_id) AS value
      ${currentJobFilterSql}
      AND current_jobs.industry_sector IS NOT NULL
      GROUP BY current_jobs.industry_sector
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    const [certificationTrendRaw] = await db.query(`
      SELECT
        DATE_FORMAT(c.issue_date, '%b') AS month,
        MONTH(c.issue_date) AS monthNumber,
        SUM(CASE WHEN LOWER(c.name) LIKE '%aws%' THEN 1 ELSE 0 END) AS AWS,
        SUM(CASE WHEN LOWER(c.name) LIKE '%azure%' THEN 1 ELSE 0 END) AS Azure,
        SUM(CASE WHEN LOWER(c.name) LIKE '%gcp%' OR LOWER(c.name) LIKE '%google cloud%' THEN 1 ELSE 0 END) AS GCP,
        SUM(CASE WHEN LOWER(c.name) LIKE '%docker%' THEN 1 ELSE 0 END) AS Docker
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND c.issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY MONTH(c.issue_date), DATE_FORMAT(c.issue_date, '%b')
      ORDER BY monthNumber ASC
    `, params);

    const certificationTrend = certificationTrendRaw.map((item) => ({
      month: item.month,
      AWS: Number(item.AWS),
      Azure: Number(item.Azure),
      GCP: Number(item.GCP),
      Docker: Number(item.Docker)
    }));

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
      SELECT
        COALESCE(current_jobs.industry_sector, 'N/A') AS sector,
        COUNT(DISTINCT current_jobs.user_id) AS count
      ${currentJobFilterSql}
      AND current_jobs.industry_sector IS NOT NULL
      GROUP BY current_jobs.industry_sector
      ORDER BY count DESC
      LIMIT 1
    `, currentJobParams);

    const totalAlumni = alumniCountResult[0]?.count || 0;
    const totalCertifications = certificationCountResult[0]?.count || 0;
    const topIndustry = topIndustryResult.length > 0 ? topIndustryResult[0].sector : 'N/A';

    res.json({
      skillsGap,
      industryEmployment,
      jobTitles,
      topEmployers,
      locationDistribution,
      sectorDemand,
      certificationTrend,
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