// Import the database connection pool.
// Using a pool (instead of a single connection) is efficient because it reuses 
// existing connections for multiple queries, preventing server overload.
const pool = require('../config/db');

const Profile = {
  /**
   * Fetches the complete profile for a user, including all their related
   * sub-records (degrees, certifications, employment, etc.) in a single nested object.
   */
  async getProfileByUserId(userId) {
    // 1. Fetch the main profile record.
    // Using '?' (Parameterized queries) automatically escapes the input, 
    // which prevents SQL Injection attacks.
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    // If no profile exists for this user, exit early and return null.
    if (profiles.length === 0) return null;

    const profile = profiles[0];

    // 2. Fetch all related entities concurrently.
    // Notice the 'ORDER BY' clauses which ensure the frontend receives data 
    // logically sorted (most recent first).
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

    // 3. Assemble and return the complete profile object.
    // Uses the spread operator (...) to combine the main profile fields with the arrays of sub-records.
    return {
      ...profile,
      degrees,
      certifications,
      licences,
      courses,
      employment
    };
  },

  /**
   * Creates a new base profile for a user.
   */
  async createProfile(userId, bio, linkedinUrl, imageUrl = null) {
    const [result] = await pool.execute(
      `INSERT INTO profiles (user_id, bio, linkedin_url, image_url)
       VALUES (?, ?, ?, ?)`,
      [userId, bio, linkedinUrl, imageUrl]
    );
    // Returns the auto-incremented ID of the newly created profile row.
    return result.insertId;
  },

  /**
   * Updates an existing profile's basic information.
   */
  async updateProfile(userId, bio, linkedinUrl, imageUrl = null) {
    const [result] = await pool.execute(
      `UPDATE profiles
       SET bio = ?, linkedin_url = ?, image_url = ?
       WHERE user_id = ?`,
      [userId, bio, linkedinUrl, imageUrl, userId] // Note: userId is mapped twice in the query but only needed once at the end in the array. Wait, the array order matches the ? order: bio, linkedin, image, userId. Correct.
    );
    // affectedRows will be > 0 if a row was actually updated. Returns true/false.
    return result.affectedRows > 0;
  },

  /**
   * Adds a new educational degree to the user's profile.
   */
  async addDegree(profileId, degreeName, degreeUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_degrees (profile_id, degree_name, degree_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, degreeName, degreeUrl, completionDate]
    );
    return result.insertId;
  },

  /**
   * Adds a new certification to the user's profile.
   */
  async addCertification(profileId, certificationName, providerUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_certifications (profile_id, certification_name, provider_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, certificationName, providerUrl, completionDate]
    );
    return result.insertId;
  },

  /**
   * Adds a new professional licence to the user's profile.
   */
  async addLicence(profileId, licenceName, awardingBodyUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_licences (profile_id, licence_name, awarding_body_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, licenceName, awardingBodyUrl, completionDate]
    );
    return result.insertId;
  },

  /**
   * Adds a new completed course to the user's profile.
   */
  async addCourse(profileId, courseName, courseUrl, completionDate) {
    const [result] = await pool.execute(
      `INSERT INTO profile_courses (profile_id, course_name, course_url, completion_date)
       VALUES (?, ?, ?, ?)`,
      [profileId, courseName, courseUrl, completionDate]
    );
    return result.insertId;
  },

  /**
   * Adds a new employment history record.
   */
  async addEmployment(profileId, companyName, jobTitle, startDate, endDate) {
    const [result] = await pool.execute(
      `INSERT INTO employment_history (profile_id, company_name, job_title, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [profileId, companyName, jobTitle, startDate, endDate]
    );
    return result.insertId;
  },

  /**
   * Deletes a specific degree.
   * Note: It checks BOTH id and profile_id to ensure a user can't maliciously 
   * delete another user's degree by guessing the degree ID.
   */
  async deleteDegree(id, profileId) {
    const [result] = await pool.execute(
      'DELETE FROM profile_degrees WHERE id = ? AND profile_id = ?',
      [id, profileId]
    );
    // Returns true if the deletion was successful.
    return result.affectedRows > 0;
  }
};

module.exports = Profile;