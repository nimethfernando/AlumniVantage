import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState({ bio: '', linkedin_url: '' });
  const [image, setImage] = useState(null);
  const [degrees, setDegrees] = useState([]);
  const [newDegree, setNewDegree] = useState({ degree_name: '', university_url: '', completion_date: '' });
  const [degrees, setDegrees] = useState([]);
  const [newDegree, setNewDegree] = useState({ degree_name: '', university_url: '', completion_date: '' });

  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ cert_name: '', course_url: '', completion_date: '' });
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
      if(res.data.certifications) setCertifications(res.data.certifications);
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
            <strong>{deg.degree_name}</strong> - <a href={deg.university_url} target="_blank">University Link</a> ({new Date(deg.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>

      {/* Add Degree Form */}
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

      {/* Certifications Section */}
      <h3>Certifications</h3>
      <ul>
        {certifications.map((cert, index) => (
          <li key={index}>
            <strong>{cert.cert_name}</strong> - <a href={cert.course_url} target="_blank">Course Link</a> ({new Date(cert.completion_date).toLocaleDateString()})
          </li>
        ))}
      </ul>

      {/* Add Certification Form */}
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
        
    </div>
  );
};

export default Profile;