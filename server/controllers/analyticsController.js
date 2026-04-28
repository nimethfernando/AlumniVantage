const db = require('../config/db'); // Import DB connection pool to handle concurrent query execution

// --- GET FILTER OPTIONS ---
// Fetches unique Programmes, Years, and Sectors to populate the frontend dashboard dropdowns
exports.getFilterOptions = async (req, res) => {
  try {
    // Fetch unique degree names, filtering out null/empty strings to keep the UI clean
    const [programmes] = await db.query(`
      SELECT DISTINCT degree_name FROM degrees 
      WHERE degree_name IS NOT NULL AND degree_name != ''
      ORDER BY degree_name ASC
    `);

    // Fetch unique graduation years dynamically extracted from completion_date
    const [years] = await db.query(`
      SELECT DISTINCT YEAR(completion_date) as year FROM degrees 
      WHERE completion_date IS NOT NULL 
      ORDER BY year DESC
    `);

    // Fetch unique industry sectors from current and past employment records
    const [sectors] = await db.query(`
      SELECT DISTINCT industry_sector FROM employment_history 
      WHERE industry_sector IS NOT NULL AND industry_sector != ''
      ORDER BY industry_sector ASC
    `);

    res.json({ // Map the raw SQL row objects into flat arrays for easier frontend consumption
      programmes: programmes.map(p => p.degree_name),
      years: years.map(y => y.year).filter(y => y !== null), // Filter out any null years just in case
      sectors: sectors.map(s => s.industry_sector)
    });
  } catch (error) {
    console.error('Failed to fetch filter options:', error); // Log server-side for debugging
    res.status(500).json({ error: 'Failed to fetch filter options' }); // Generic client error
  }
};


// --- GET DASHBOARD ANALYTICS ---
// Processes the selected filters and executes 10 queries to return all chart data simultaneously
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const programme = req.query.programme || null; // Extract filter from URL query
    const graduationYear = req.query.graduationYear || null; // Extract year filter
    const sector = req.query.sector || null; // Extract sector filter

    const conditions = ['u.is_verified = 1']; // Base security condition: only count verified users
    const params = []; // Array to hold parameterized values preventing SQL injection

    if (programme) { // Dynamically build the WHERE clause based on active filters
      conditions.push('d.degree_name LIKE ?'); // Use LIKE for partial degree name matching
      params.push(`%${programme}%`);
    }

    if (graduationYear) {
      conditions.push('YEAR(d.completion_date) = ?'); // Exact match for graduation year
      params.push(graduationYear);
    }

    if (sector) {
      conditions.push('eh.industry_sector = ?'); // Exact match for employment sector
      params.push(sector);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`; // Combine conditions into final SQL string

    // --- SKILLS GAP ANALYTICS ---
    const [skillsRaw] = await db.query(`
      SELECT
        skill,
        MAX(curriculum_value) AS curriculum,
        LEAST(COUNT(DISTINCT u.id) * 10, 100) AS alumni, -- CHANGED to prevent duplicate counting, capped at 100
        100 AS fullMark -- Max scale for Recharts radar chart
      FROM (
        SELECT 'Docker' AS skill, 15 AS curriculum_value -- Hardcoded curriculum baseline weights
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
      ${whereClause} -- Inject the dynamic filter conditions
      AND ( -- Massive OR block to scan certs/courses for wildcard skill keywords
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
    const curriculumMap = { // Mapping object to ensure frontend structure matches exactly
      Docker: 15,
      Kubernetes: 10,
      Cloud: 35,
      'Data Analytics': 30,
      Agile: 25,
      Cybersecurity: 60
    };

    const skillsGap = skillOrder.map((skill) => { // Construct the final array for the radar chart
      const found = skillsRaw.find((item) => item.skill === skill);
      return {
        subject: skill,
        university: curriculumMap[skill],
        alumni: found ? Number(found.alumni) : 0, // Fallback to 0 if no alumni match
        fullMark: 100
      };
    });

    // --- CURRENT EMPLOYMENT FILTER ---
    const currentJobFilterSql = ` -- Sub-query specifically targeting active jobs (end_date IS NULL)
      FROM employment_history eh
      INNER JOIN users u ON u.id = eh.user_id
      LEFT JOIN degrees d ON d.user_id = u.id
      WHERE u.is_verified = 1
      AND eh.end_date IS NULL
      ${programme ? 'AND d.degree_name LIKE ?' : ''}
      ${graduationYear ? 'AND YEAR(d.completion_date) = ?' : ''}
      ${sector ? 'AND eh.industry_sector = ?' : ''}
    `;

    const currentJobParams = [ // Reconstruct params array since this is a separate SQL execution context
      ...(programme ? [`%${programme}%`] : []),
      ...(graduationYear ? [graduationYear] : []),
      ...(sector ? [sector] : [])
    ];

    // --- EMPLOYMENT CHARTS ---
    const [industryEmployment] = await db.query(`
      SELECT
        COALESCE(eh.industry_sector, 'Unknown') AS name, -- Replace NULLs with 'Unknown' for clean UI
        COUNT(DISTINCT eh.user_id) AS value
      ${currentJobFilterSql}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY value DESC
      LIMIT 8 -- Restrict to top 8 for Pie Chart readability
    `, currentJobParams);

    const [jobTitles] = await db.query(`
      SELECT
        COALESCE(eh.role, 'Unknown') AS name,
        COUNT(DISTINCT eh.user_id) AS value
      ${currentJobFilterSql}
      AND eh.role IS NOT NULL
      GROUP BY eh.role
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    const [topEmployers] = await db.query(`
      SELECT
        COALESCE(eh.company, 'Unknown') AS employer,
        COUNT(DISTINCT eh.user_id) AS alumni_count
      ${currentJobFilterSql}
      AND eh.company IS NOT NULL
      GROUP BY eh.company
      ORDER BY alumni_count DESC
      LIMIT 10
    `, currentJobParams);

    const [locationDistribution] = await db.query(`
      SELECT
        COALESCE(eh.location, 'Unknown') AS location,
        COUNT(DISTINCT eh.user_id) AS value
      ${currentJobFilterSql}
      AND eh.location IS NOT NULL
      GROUP BY eh.location
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    const [sectorDemand] = await db.query(`
      SELECT
        COALESCE(eh.industry_sector, 'Unknown') AS sector,
        COUNT(DISTINCT eh.user_id) AS value
      ${currentJobFilterSql}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY value DESC
      LIMIT 10
    `, currentJobParams);

    // --- OTHER ANALYTICS ---
    const [certificationTrendRaw] = await db.query(`
      SELECT
        DATE_FORMAT(c.issue_date, '%b') AS month, -- Group by abbreviated month name (Jan, Feb)
        MONTH(c.issue_date) AS monthNumber, -- Keep numeric month for accurate chronological sorting
        COUNT(DISTINCT CASE WHEN LOWER(c.name) LIKE '%aws%' THEN u.id ELSE NULL END) AS AWS,
        COUNT(DISTINCT CASE WHEN LOWER(c.name) LIKE '%azure%' THEN u.id ELSE NULL END) AS Azure,
        COUNT(DISTINCT CASE WHEN LOWER(c.name) LIKE '%gcp%' OR LOWER(c.name) LIKE '%google cloud%' THEN u.id ELSE NULL END) AS GCP,
        COUNT(DISTINCT CASE WHEN LOWER(c.name) LIKE '%docker%' THEN u.id ELSE NULL END) AS Docker
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND c.issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) -- Restrict trendline to last 6 months
      GROUP BY MONTH(c.issue_date), DATE_FORMAT(c.issue_date, '%b')
      ORDER BY monthNumber ASC
    `, params);

    const certificationTrend = certificationTrendRaw.map((item) => ({ // Strip monthNumber before sending to client
      month: item.month,
      AWS: Number(item.AWS),
      Azure: Number(item.Azure),
      GCP: Number(item.GCP),
      Docker: Number(item.Docker)
    }));

    const [coursesPopularity] = await db.query(`
      SELECT
        sc.course_name AS subject,
        COUNT(DISTINCT sc.id) AS value -- CHANGED from COUNT(*) to prevent duplicates skewing the chart
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

    // --- SUMMARY METRICS ---
    const [alumniCountResult] = await db.query(`
      SELECT COUNT(DISTINCT u.id) AS count -- Distinct ensures users aren't double-counted if they have multiple degrees
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      ${whereClause}
    `, params);

    const [certificationCountResult] = await db.query(`
      SELECT COUNT(DISTINCT c.id) AS count -- CHANGED from COUNT(c.id) to prevent duplicates
      FROM users u
      LEFT JOIN degrees d ON d.user_id = u.id
      LEFT JOIN employment_history eh ON eh.user_id = u.id
      LEFT JOIN certifications c ON c.user_id = u.id
      ${whereClause}
      AND c.id IS NOT NULL
    `, params);

    const [topIndustryResult] = await db.query(`
      SELECT
        COALESCE(eh.industry_sector, 'N/A') AS sector,
        COUNT(DISTINCT eh.user_id) AS count
      ${currentJobFilterSql}
      AND eh.industry_sector IS NOT NULL
      GROUP BY eh.industry_sector
      ORDER BY count DESC
      LIMIT 1 -- Limit to 1 to just grab the absolute most popular industry for the top stat card
    `, currentJobParams);

    const totalAlumni = alumniCountResult[0]?.count || 0; // Safely extract count, default to 0
    const totalCertifications = certificationCountResult[0]?.count || 0;
    const topIndustry = topIndustryResult.length > 0 ? topIndustryResult[0].sector : 'N/A';

    res.json({ // Bundle all 10 datasets into a single JSON response to minimize HTTP requests
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