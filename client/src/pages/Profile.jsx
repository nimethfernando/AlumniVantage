import { useState, useEffect } from 'react';
import axios from 'axios';

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
      if (res.data.shortCourses) setShortCourses(res.data.shortCourses);
      if (res.data.employmentHistory) setEmploymentHistory(res.data.employmentHistory);
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
      setNewDegree({ degree_name: '', university_url: '', completion_date: '' }); // Reset form
      fetchProfile(); // Refresh list
    } catch (err) {
      alert('Error adding degree');
    }
  };

  const handleAddCertification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/profile/certifications', newCert);
      setNewCert({ cert_name: '', course_url: '', completion_date: '' }); // Reset form
      fetchProfile(); // Refresh list
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
      await axios.post('http://localhost:3000/api/profile/short-courses', newShortCourse);
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
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>Alumni Profile</h2>

      {/* Profile Picture Display */}
      {profile.profile_image_url && (
        <img 
          src={`http://localhost:3000${profile.profile_image_url}`} 
          alt="Profile" 
          style={{ width: '150px', height: '150px', borderRadius: '50%' }} 
        />
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleProfileSubmit}>
        <div>
          <label>Profile Image:</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>
        <div>
          <label>Bio:</label>
          <textarea 
            value={profile.bio} 
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
          />
        </div>
        <div>
          <label>LinkedIn URL:</label>
          <input 
            type="url" 
            value={profile.linkedin_url} 
            onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} 
          />
        </div>
        <button type="submit">Save Profile</button>
      </form>

      <hr />

      {/* Degrees Section */}
      <h3>Degrees</h3>
      <ul>
        {degrees.map((deg, index) => (
          <li key={index}>
            <strong>{deg.degree_name}</strong> - <a href={deg.university_url} target="_blank" rel="noreferrer">University Link</a> ({new Date(deg.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddDegree}>
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
        <button type="submit">Add Degree</button>
      </form>

      <hr />

      {/* Certifications Section */}
      <h3>Certifications</h3>
      <ul>
        {certifications.map((cert, index) => (
          <li key={index}>
            <strong>{cert.cert_name}</strong> - <a href={cert.course_url} target="_blank" rel="noreferrer">Course Link</a> ({new Date(cert.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddCertification}>
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
        <button type="submit">Add Certification</button>
      </form>

      <hr />

      {/* Professional Licenses Section */}
      <h3>Professional Licenses</h3>
      <ul>
        {licenses.map((lic, index) => (
          <li key={index}>
            <strong>{lic.license_name}</strong> - <a href={lic.awarding_body_url} target="_blank" rel="noreferrer">Awarding Body Link</a> ({new Date(lic.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddLicense}>
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
        <button type="submit">Add License</button>
      </form>

      <hr />

      {/* Short Professional Courses Section */}
      <h3>Short Professional Courses</h3>
      <ul>
        {shortCourses.map((course, index) => (
          <li key={index}>
            <strong>{course.course_name}</strong> - <a href={course.course_url} target="_blank" rel="noreferrer">Course Link</a> ({new Date(course.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddShortCourse}>
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
        <button type="submit">Add Short Course</button>
      </form>

      <hr />

      {/* Employment History Section */}
      <h3>Employment History</h3>
      <ul>
        {employmentHistory.map((job, index) => (
          <li key={index}>
            <strong>{job.job_title}</strong> at {job.company_name} <br/>
            ({new Date(job.start_date).toLocaleDateString()} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'})
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddEmployment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <input 
          type="text" placeholder="Job Title" required 
          value={newEmployment.job_title} 
          onChange={(e) => setNewEmployment({ ...newEmployment, job_title: e.target.value })} 
        />
        <input 
          type="text" placeholder="Company Name" required 
          value={newEmployment.company_name} 
          onChange={(e) => setNewEmployment({ ...newEmployment, company_name: e.target.value })} 
        />
        <div>
          <label>Start Date:</label>
          <input 
            type="date" required style={{ marginLeft: '10px' }}
            value={newEmployment.start_date} 
            onChange={(e) => setNewEmployment({ ...newEmployment, start_date: e.target.value })} 
          />
        </div>
        <div>
          <label>End Date (leave blank if current):</label>
          <input 
            type="date" style={{ marginLeft: '10px' }}
            value={newEmployment.end_date} 
            onChange={(e) => setNewEmployment({ ...newEmployment, end_date: e.target.value })} 
          />
        </div>
        <button type="submit">Add Employment</button>
      </form>

    </div>
  );
};

export default Profile;