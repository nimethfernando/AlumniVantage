const pool = require('../config/db');

const Profile = {
  async getProfileByUserId(userId) {
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) return null;

    const profile = profiles[0];

    const [degrees] = await pool.execute(
      'SELECT * FROM profile_degrees WHERE profile_id = ? ORDER BY completion_date DESC',
      [profile.id]
    );

    const [certifications] = await pool.execute(
      'SELECT * FROM profile_certifications WHERE profile_id = ? ORDER BY completion_date DESC',
      [profile.id]
    );

    const [licences] = await pool.execute(
      'SELECT * FROM profile_licences WHERE profile_id = ? ORDER BY completion_date DESC',
      [profile.id]
    );

    const [courses] = await pool.execute(
      'SELECT * FROM profile_courses WHERE profile_id = ? ORDER BY completion_date DESC',
      [profile.id]
    );

    const [employment] = await pool.execute(
      'SELECT * FROM employment_history WHERE profile_id = ? ORDER BY start_date DESC',
      [profile.id]
    );

    return {
      ...profile,
      degrees,
      certifications,
      licences,
      courses,
      employment
    };
  },

  async createProfile(userId, bio, linkedinUrl, imageUrl = null) {
    const [result] = await pool.execute(
      `INSERT INTO profiles (user_id, bio, linkedin_url, image_url)
       VALUES (?, ?, ?, ?)`,
      [userId, bio, linkedinUrl, imageUrl]
    );
    return result.insertId;
  },

  async updateProfile(userId, bio, linkedinUrl, imageUrl = null) {
    const [result] = await pool.execute(
      `UPDATE profiles
       SET bio = ?, linkedin_url = ?, image_url = ?
       WHERE user_id = ?`,
      [bio, linkedinUrl, imageUrl, userId]
    );
    return result.affectedRows > 0;
  },

  async addDegree(profileId, degreeName, degreeUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_degrees (profile_id, degree_name, degree_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, degreeName, degreeUrl, completionDate]
    );
    return result.insertId;
  },

  async addCertification(profileId, certificationName, providerUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_certifications (profile_id, certification_name, provider_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, certificationName, providerUrl, completionDate]
    );
    return result.insertId;
  },

  async addLicence(profileId, licenceName, awardingBodyUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_licences (profile_id, licence_name, awarding_body_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, licenceName, awardingBodyUrl, completionDate]
    );
    return result.insertId;
  },

  async addCourse(profileId, courseName, courseUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_courses (profile_id, course_name, course_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, courseName, courseUrl, completionDate]
    );
    return result.insertId;
  },

  async addEmployment(profileId, companyName, jobTitle, startDate, endDate) {
    const [result] = await pool.execute(
      `INSERT INTO employment_history (profile_id, company_name, job_title, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [profileId, companyName, jobTitle, startDate, endDate]
    );
    return result.insertId;
  },

  async deleteDegree(id, profileId) {
    const [result] = await pool.execute(
      'DELETE FROM profile_degrees WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Profile;