import { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'; // Make sure this imports your updated CSS

const Profile = () => {
  const [profile, setProfile] = useState({ bio: '', linkedin_url: '' });
  const [image, setImage] = useState(null);
  
  const [degrees, setDegrees] = useState([]);
  const [newDegree, setNewDegree] = useState({ degree_name: '', university_url: '', completion_date: '' });

  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ cert_name: '', course_url: '', completion_date: '' });

  // --- NEW STATES FOR ADDED SECTIONS ---
  const [licenses, setLicenses] = useState([]);
  const [newLicense, setNewLicense] = useState({ license_name: '', awarding_body_url: '', completion_date: '' });

  const [shortCourses, setShortCourses] = useState([]);
  const [newShortCourse, setNewShortCourse] = useState({ course_name: '', course_url: '', completion_date: '' });

  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [newEmployment, setNewEmployment] = useState({ job_title: '', company_name: '', start_date: '', end_date: '' });

  // Add credentials to axios if using HttpOnly cookies
  axios.defaults.withCredentials = true;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/profile');
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.degrees) setDegrees(res.data.degrees);
      if (res.data.certifications) setCertifications(res.data.certifications);
      
      // Fetch new sections
      if (res.data.licenses) setLicenses(res.data.licenses);
      if (res.data.courses) setShortCourses(res.data.courses); // Adjusted to match your backend controller 'courses' key
      if (res.data.employment) setEmploymentHistory(res.data.employment); // Adjusted to match your backend controller 'employment' key
    } catch (err) {
      console.error("Failed to fetch profile");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', profile.bio);
    formData.append('linkedin_url', profile.linkedin_url);
    if (image) formData.append('profile_image', image);

    try {
      await axios.post('http://localhost:3000/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Profile Updated Successfully!');
      fetchProfile(); // Refresh data
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const handleAddDegree = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/degrees', newDegree);
      setNewDegree({ degree_name: '', university_url: '', completion_date: '' }); 
      fetchProfile(); 
    } catch (err) {
      alert('Error adding degree');
    }
  };

  const handleAddCertification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/certifications', newCert);
      setNewCert({ cert_name: '', course_url: '', completion_date: '' }); 
      fetchProfile(); 
    } catch (err) {
      alert('Error adding certification');
    }
  };

  // --- NEW HANDLERS FOR ADDED SECTIONS ---
  const handleAddLicense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/licenses', newLicense);
      setNewLicense({ license_name: '', awarding_body_url: '', completion_date: '' });
      fetchProfile();
    } catch (err) {
      alert('Error adding license');
    }
  };

  const handleAddShortCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/courses', newShortCourse); // ensure this matches your backend route
      setNewShortCourse({ course_name: '', course_url: '', completion_date: '' });
      fetchProfile();
    } catch (err) {
      alert('Error adding short course');
    }
  };

  const handleAddEmployment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/employment', newEmployment);
      setNewEmployment({ job_title: '', company_name: '', start_date: '', end_date: '' });
      fetchProfile();
    } catch (err) {
      alert('Error adding employment history');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        {profile.profile_image_url ? (
          <img 
            src={`http://localhost:3000${profile.profile_image_url}`} 
            alt="Profile" 
            className="profile-image"
          />
        ) : (
          <div className="profile-image-placeholder">No Image</div>
        )}
        <h2>Alumni Profile</h2>
      </div>

      {/* Main Profile Form */}
      <div className="card-section">
        <h3>Personal Information</h3>
        <form className="custom-form" onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label>Profile Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="file-input" />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea 
              rows="4"
              placeholder="Tell us about yourself..."
              value={profile.bio} 
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input 
              type="url" 
              placeholder="https://linkedin.com/in/yourprofile"
              value={profile.linkedin_url} 
              onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn-primary">Save Profile</button>
        </form>
      </div>

      {/* Degrees Section */}
      <div className="card-section">
        <h3>Degrees</h3>
        {degrees.length > 0 ? (
          <ul className="item-list">
            {degrees.map((deg, index) => (
              <li key={index} className="list-item">
                <div className="item-details">
                  <strong>{deg.degree_name}</strong>
                  <span>{new Date(deg.completion_date).toLocaleDateString()}</span>
                </div>
                <a href={deg.university_url} target="_blank" rel="noopener noreferrer" className="link-btn">University Link</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No degrees added yet.</p>
        )}
        <form className="inline-form" onSubmit={handleAddDegree}>
          <input 
            type="text" placeholder="Degree Name" required
            value={newDegree.degree_name} 
            onChange={(e) => setNewDegree({ ...newDegree, degree_name: e.target.value })} 
          />
          <input 
            type="url" placeholder="University URL" required
            value={newDegree.university_url} 
            onChange={(e) => setNewDegree({ ...newDegree, university_url: e.target.value })} 
          />
          <input 
            type="date" required
            value={newDegree.completion_date} 
            onChange={(e) => setNewDegree({ ...newDegree, completion_date: e.target.value })} 
          />
          <button type="submit" className="btn-secondary">Add Degree</button>
        </form>
      </div>

      {/* Certifications Section */}
      <div className="card-section">
        <h3>Certifications</h3>
        {certifications.length > 0 ? (
          <ul className="item-list">
            {certifications.map((cert, index) => (
              <li key={index} className="list-item">
                <div className="item-details">
                  <strong>{cert.cert_name}</strong>
                  <span>{new Date(cert.completion_date).toLocaleDateString()}</span>
                </div>
                <a href={cert.course_url} target="_blank" rel="noopener noreferrer" className="link-btn">Course Link</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No certifications added yet.</p>
        )}
        <form className="inline-form" onSubmit={handleAddCertification}>
          <input 
            type="text" placeholder="Certification Name" required
            value={newCert.cert_name} 
            onChange={(e) => setNewCert({ ...newCert, cert_name: e.target.value })} 
          />
          <input 
            type="url" placeholder="Course URL" required
            value={newCert.course_url} 
            onChange={(e) => setNewCert({ ...newCert, course_url: e.target.value })} 
          />
          <input 
            type="date" required
            value={newCert.completion_date} 
            onChange={(e) => setNewCert({ ...newCert, completion_date: e.target.value })} 
          />
          <button type="submit" className="btn-secondary">Add Cert</button>
        </form>
      </div>

      {/* Professional Licenses Section */}
      <div className="card-section">
        <h3>Professional Licenses</h3>
        {licenses.length > 0 ? (
          <ul className="item-list">
            {licenses.map((lic, index) => (
              <li key={index} className="list-item">
                <div className="item-details">
                  <strong>{lic.license_name}</strong>
                  <span>{new Date(lic.completion_date).toLocaleDateString()}</span>
                </div>
                <a href={lic.awarding_body_url} target="_blank" rel="noopener noreferrer" className="link-btn">Awarding Body</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No licenses added yet.</p>
        )}
        <form className="inline-form" onSubmit={handleAddLicense}>
          <input 
            type="text" placeholder="License Name" required 
            value={newLicense.license_name} 
            onChange={(e) => setNewLicense({ ...newLicense, license_name: e.target.value })} 
          />
          <input 
            type="url" placeholder="Awarding Body URL" required 
            value={newLicense.awarding_body_url} 
            onChange={(e) => setNewLicense({ ...newLicense, awarding_body_url: e.target.value })} 
          />
          <input 
            type="date" required 
            value={newLicense.completion_date} 
            onChange={(e) => setNewLicense({ ...newLicense, completion_date: e.target.value })} 
          />
          <button type="submit" className="btn-secondary">Add License</button>
        </form>
      </div>

      {/* Short Professional Courses Section */}
      <div className="card-section">
        <h3>Short Professional Courses</h3>
        {shortCourses.length > 0 ? (
          <ul className="item-list">
            {shortCourses.map((course, index) => (
              <li key={index} className="list-item">
                <div className="item-details">
                  <strong>{course.course_name}</strong>
                  <span>{new Date(course.completion_date).toLocaleDateString()}</span>
                </div>
                <a href={course.course_url} target="_blank" rel="noopener noreferrer" className="link-btn">Course Link</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No short courses added yet.</p>
        )}
        <form className="inline-form" onSubmit={handleAddShortCourse}>
          <input 
            type="text" placeholder="Course Name" required 
            value={newShortCourse.course_name} 
            onChange={(e) => setNewShortCourse({ ...newShortCourse, course_name: e.target.value })} 
          />
          <input 
            type="url" placeholder="Course URL" required 
            value={newShortCourse.course_url} 
            onChange={(e) => setNewShortCourse({ ...newShortCourse, course_url: e.target.value })} 
          />
          <input 
            type="date" required 
            value={newShortCourse.completion_date} 
            onChange={(e) => setNewShortCourse({ ...newShortCourse, completion_date: e.target.value })} 
          />
          <button type="submit" className="btn-secondary">Add Course</button>
        </form>
      </div>

      {/* Employment History Section */}
      <div className="card-section">
        <h3>Employment History</h3>
        {employmentHistory.length > 0 ? (
          <ul className="item-list">
            {employmentHistory.map((job, index) => (
              <li key={index} className="list-item">
                <div className="item-details">
                  <strong>{job.job_title}</strong>
                  <span>{job.company_name}</span>
                  <span style={{color: '#646cff'}}>
                    {new Date(job.start_date).toLocaleDateString()} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No employment history added yet.</p>
        )}
        <form className="custom-form" onSubmit={handleAddEmployment} style={{marginTop: '1.5rem'}}>
          <div className="form-group">
            <label>Job Title</label>
            <input 
              type="text" placeholder="e.g. Software Engineer" required 
              value={newEmployment.job_title} 
              onChange={(e) => setNewEmployment({ ...newEmployment, job_title: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input 
              type="text" placeholder="e.g. Google" required 
              value={newEmployment.company_name} 
              onChange={(e) => setNewEmployment({ ...newEmployment, company_name: e.target.value })} 
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input 
                type="date" required 
                value={newEmployment.start_date} 
                onChange={(e) => setNewEmployment({ ...newEmployment, start_date: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End Date (Optional)</label>
              <input 
                type="date" 
                value={newEmployment.end_date} 
                onChange={(e) => setNewEmployment({ ...newEmployment, end_date: e.target.value })} 
              />
            </div>
          </div>
          <button type="submit" className="btn-secondary" style={{alignSelf: 'flex-start'}}>Add Employment</button>
        </form>
      </div>

    </div>
  );
};

export default Profile;