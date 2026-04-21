const pool = require('../config/db');

// --- HELPER FUNCTION FOR URL VALIDATION ---
const isValidUrl = (urlString) => {
  if (!urlString) return true;
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [profile] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const [degrees] = await pool.execute('SELECT * FROM degrees WHERE user_id = ? ORDER BY completion_date DESC', [userId]);
    const [certifications] = await pool.execute('SELECT * FROM certifications WHERE user_id = ? ORDER BY issue_date DESC', [userId]);
    const [courses] = await pool.execute('SELECT * FROM short_courses WHERE user_id = ? ORDER BY completion_date DESC', [userId]);
    const [employment] = await pool.execute('SELECT * FROM employment_history WHERE user_id = ? ORDER BY start_date DESC', [userId]);
    const [licenses] = await pool.execute('SELECT * FROM licenses WHERE user_id = ? ORDER BY completion_date DESC', [userId]);

    res.json({
      profile: profile[0] || {},
      degrees: degrees,
      certifications: certifications,
      courses: courses,
      employment: employment,
      licenses: licenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

exports.getProfileCompletionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [profileRows] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const profile = profileRows[0] || {};
    const [degrees] = await pool.execute('SELECT id FROM degrees WHERE user_id = ? LIMIT 1', [userId]);
    const [certifications] = await pool.execute('SELECT id FROM certifications WHERE user_id = ? LIMIT 1', [userId]);
    const [licenses] = await pool.execute('SELECT id FROM licenses WHERE user_id = ? LIMIT 1', [userId]);
    const [courses] = await pool.execute('SELECT id FROM short_courses WHERE user_id = ? LIMIT 1', [userId]);
    const [employment] = await pool.execute('SELECT id FROM employment_history WHERE user_id = ? LIMIT 1', [userId]);

    const checklist = [
      { key: 'bio', completed: !!(profile.bio && profile.bio.trim()) },
      { key: 'linkedin_url', completed: !!(profile.linkedin_url && profile.linkedin_url.trim()) },
      { key: 'profile_image', completed: !!(profile.profile_image_url && profile.profile_image_url.trim()) },
      { key: 'degrees', completed: degrees.length > 0 },
      { key: 'certifications', completed: certifications.length > 0 },
      { key: 'licenses', completed: licenses.length > 0 },
      { key: 'courses', completed: courses.length > 0 },
      { key: 'employment', completed: employment.length > 0 }
    ];

    const completed = checklist.filter(item => item.completed).map(item => item.key);
    const missing = checklist.filter(item => !item.completed).map(item => item.key);
    const completion_percentage = Math.round((completed.length / checklist.length) * 100);

    res.status(200).json({
      completion_percentage,
      completed,
      missing,
      total_sections: checklist.length,
      completed_sections: completed.length
    });
  } catch (error) {
    console.error('Get profile completion status error:', error);
    res.status(500).json({ error: 'Failed to fetch profile completion status' });
  }
};

exports.getDegrees = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM degrees WHERE user_id = ? ORDER BY completion_date DESC', [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Get degrees error:', error);
    res.status(500).json({ error: 'Failed to fetch degrees' });
  }
};

exports.getCertifications = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM certifications WHERE user_id = ? ORDER BY issue_date DESC', [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
};

exports.getLicenses = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM licenses WHERE user_id = ? ORDER BY completion_date DESC', [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM short_courses WHERE user_id = ? ORDER BY completion_date DESC', [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.getEmployment = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM employment_history WHERE user_id = ? ORDER BY start_date DESC',
      [req.user.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get employment error:', error);
    res.status(500).json({ error: 'Failed to fetch employment' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bio, linkedin_url } = req.body;
    let profile_image_url = null;

    if (linkedin_url && !isValidUrl(linkedin_url)) {
      return res.status(400).json({ error: "Invalid LinkedIn URL format." });
    }

    if (req.file) {
      profile_image_url = `/uploads/${req.file.filename}`;
    }

    const [existing] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    if (existing.length > 0) {
      let query = 'UPDATE profiles SET bio = ?, linkedin_url = ?';
      let params = [bio, linkedin_url];

      if (profile_image_url) {
        query += ', profile_image_url = ?';
        params.push(profile_image_url);
      }
      query += ' WHERE user_id = ?';
      params.push(userId);

      await pool.execute(query, params);
    } else {
      await pool.execute(
        'INSERT INTO profiles (user_id, bio, linkedin_url, profile_image_url) VALUES (?, ?, ?, ?)',
        [userId, bio, linkedin_url, profile_image_url]
      );
    }

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error updating profile" });
  }
};

exports.addDegree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { degree_name, university_url, completion_date } = req.body;

    if (university_url && !isValidUrl(university_url)) {
      return res.status(400).json({ error: "Invalid University URL format." });
    }

    await pool.execute(
      'INSERT INTO degrees (user_id, degree_name, university_url, completion_date) VALUES (?, ?, ?, ?)',
      [userId, degree_name, university_url, completion_date]
    );
    res.status(201).json({ message: "Degree added successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add degree" });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cert_name, course_url, completion_date } = req.body;

    if (course_url && !isValidUrl(course_url)) {
      return res.status(400).json({ error: "Invalid Course URL format." });
    }

    const name = cert_name;
    const issuing_organization = null;
    const issue_date = completion_date;
    const expiration_date = null;
    const credential_url = course_url;

    const [result] = await pool.execute(
      'INSERT INTO certifications (user_id, name, issuing_organization, issue_date, expiration_date, credential_url) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, issuing_organization, issue_date, expiration_date, credential_url]
    );

    res.status(201).json({ message: 'Certification added successfully!', certificationId: result.insertId });
  } catch (error) {
    console.error("Error adding certification:", error);
    res.status(500).json({ error: "Failed to add certification" });
  }
};

exports.addLicense = async (req, res) => {
  try {
    const { license_name, awarding_body_url, completion_date } = req.body;

    if (awarding_body_url && !isValidUrl(awarding_body_url)) {
      return res.status(400).json({ error: "Invalid Awarding Body URL format." });
    }
    const formattedDate = completion_date ? new Date(completion_date).toISOString().split('T')[0] : null;

    await pool.execute(
      'INSERT INTO licenses (user_id, license_name, awarding_body_url, completion_date) VALUES (?, ?, ?, ?)',
      [req.user.userId, license_name, awarding_body_url, formattedDate]
    );
    res.status(201).json({ message: "License added!" });
  } catch (error) {
    console.error("Add License Error:", error);
    res.status(500).json({ error: "Failed to add license" });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const { course_name, course_url, completion_date } = req.body;

    if (course_url && !isValidUrl(course_url)) {
      return res.status(400).json({ error: "Invalid Course URL format." });
    }
    const formattedDate = completion_date ? new Date(completion_date).toISOString().split('T')[0] : null;
    await pool.execute(
      'INSERT INTO short_courses (user_id, course_name, course_url, completion_date) VALUES (?, ?, ?, ?)',
      [req.user.userId, course_name, course_url, formattedDate]
    );
    res.status(201).json({ message: "Course added!" });
  } catch (error) {
    console.error("Add Course Error:", error);
    res.status(500).json({ error: "Failed to add course" });
  }
};

exports.addEmployment = async (req, res) => {
  try {
    const { company_name, job_title, industry_sector, location, start_date, end_date } = req.body;
    const formattedStart = new Date(start_date).toISOString().split('T')[0];
    const formattedEnd = end_date ? new Date(end_date).toISOString().split('T')[0] : null;

    await pool.execute(
      'INSERT INTO employment_history (user_id, company, role, industry_sector, location, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, company_name, job_title, industry_sector, location || null, formattedStart, formattedEnd]
    );

    res.status(201).json({ message: "Employment added!" });
  } catch (error) {
    console.error("Add Employment Error:", error);
    res.status(500).json({ error: "Failed to add employment" });
  }
};

exports.deleteDegree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM degrees WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Degree not found or you do not have permission to delete it." });
    }

    res.json({ message: "Degree deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete degree" });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM certifications WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Certification not found." });
    }
    res.json({ message: "Certification deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete certification" });
  }
};

exports.deleteLicense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM licenses WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "License not found." });
    }
    res.json({ message: "License deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete license" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM short_courses WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Course not found." });
    }
    res.json({ message: "Course deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

exports.deleteEmployment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM employment_history WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employment record not found." });
    }
    res.json({ message: "Employment record deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete employment record" });
  }
};

exports.updateDegree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { degree_name, university_url, completion_date } = req.body;

    if (university_url && !isValidUrl(university_url)) {
      return res.status(400).json({ error: "Invalid University URL format." });
    }

    const formattedDate = new Date(completion_date).toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE degrees SET degree_name = ?, university_url = ?, completion_date = ? WHERE id = ? AND user_id = ?',
      [degree_name, university_url, formattedDate, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Degree not found or unauthorized." });
    res.json({ message: "Degree updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update degree" });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { cert_name, course_url, completion_date } = req.body;

    if (course_url && !isValidUrl(course_url)) {
      return res.status(400).json({ error: "Invalid Course URL format." });
    }

    const formattedDate = new Date(completion_date).toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE certifications SET name = ?, credential_url = ?, issue_date = ? WHERE id = ? AND user_id = ?',
      [cert_name, course_url, formattedDate, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Certification not found." });
    res.json({ message: "Certification updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update certification" });
  }
};

exports.updateLicense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { license_name, awarding_body_url, completion_date } = req.body;

    if (awarding_body_url && !isValidUrl(awarding_body_url)) {
      return res.status(400).json({ error: "Invalid Awarding Body URL format." });
    }

    const formattedDate = new Date(completion_date).toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE licenses SET license_name = ?, awarding_body_url = ?, completion_date = ? WHERE id = ? AND user_id = ?',
      [license_name, awarding_body_url, formattedDate, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "License not found." });
    res.json({ message: "License updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update license" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { course_name, course_url, completion_date } = req.body;

    if (course_url && !isValidUrl(course_url)) {
      return res.status(400).json({ error: "Invalid Course URL format." });
    }

    const formattedDate = new Date(completion_date).toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE short_courses SET course_name = ?, course_url = ?, completion_date = ? WHERE id = ? AND user_id = ?',
      [course_name, course_url, formattedDate, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Course not found." });
    res.json({ message: "Course updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update course" });
  }
};

exports.updateEmployment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { company_name, job_title, industry_sector, location, start_date, end_date } = req.body;

    const formattedStart = new Date(start_date).toISOString().split('T')[0];
    const formattedEnd = end_date ? new Date(end_date).toISOString().split('T')[0] : null;

    const [result] = await pool.execute(
      'UPDATE employment_history SET company = ?, role = ?, industry_sector = ?, location = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?',
      [company_name, job_title, industry_sector, location || null, formattedStart, formattedEnd, id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Employment record not found." });
    res.json({ message: "Employment updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update employment" });
  }
};