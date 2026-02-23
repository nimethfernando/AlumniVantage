const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming you have a JWT middleware that sets req.user
    
    // Fetch Main Profile
    const [profile] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    // Fetch Degrees
    const [degrees] = await pool.execute('SELECT * FROM degrees WHERE user_id = ?', [userId]);

    res.json({
      profile: profile[0] || {},
      degrees: degrees
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bio, linkedin_url } = req.body;
    let profile_image_url = null;

    if (req.file) {
      profile_image_url = `/uploads/${req.file.filename}`;
    }

    // Upsert (Insert or Update) the profile
    const [existing] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    
    if (existing.length > 0) {
      // Update
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
      // Insert
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