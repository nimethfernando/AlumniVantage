import { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css'; 
import BiddingSystem from '../components/BiddingSystem';

const Profile = () => {
  const [profile, setProfile] = useState({ bio: '', linkedin_url: '' });
  const [image, setImage] = useState(null);
  
  const [degrees, setDegrees] = useState([]);
  const [newDegree, setNewDegree] = useState({ degree_name: '', university_url: '', completion_date: '' });

  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ cert_name: '', course_url: '', completion_date: '' });

  const [licenses, setLicenses] = useState([]);
  const [newLicense, setNewLicense] = useState({ license_name: '', awarding_body_url: '', completion_date: '' });

  const [shortCourses, setShortCourses] = useState([]);
  const [newShortCourse, setNewShortCourse] = useState({ course_name: '', course_url: '', completion_date: '' });

  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [newEmployment, setNewEmployment] = useState({ job_title: '', company_name: '', start_date: '', end_date: '' });

  // --- EDIT STATES ---
  const [editingDegree, setEditingDegree] = useState(null);
  const [editingCert, setEditingCert] = useState(null);
  const [editingLicense, setEditingLicense] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingEmployment, setEditingEmployment] = useState(null);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/profile');
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.degrees) setDegrees(res.data.degrees);
      if (res.data.certifications) {
        setCertifications(res.data.certifications.map(c => ({...c, cert_name: c.name, course_url: c.credential_url})));
      }
      if (res.data.licenses) setLicenses(res.data.licenses);
      if (res.data.courses) setShortCourses(res.data.courses); 
      if (res.data.employment) setEmploymentHistory(res.data.employment); 
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
      fetchProfile(); 
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
      await axios.post('http://localhost:3000/api/profile/courses', newShortCourse); 
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

  // --- DELETE HANDLERS ---
  const handleDeleteDegree = async (id) => {
    if (!window.confirm('Are you sure you want to delete this degree?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/profile/degree/${id}`);
      fetchProfile(); 
    } catch (err) {
      alert('Error deleting degree');
    }
  };

  const handleDeleteCertification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/profile/certification/${id}`);
      fetchProfile();
    } catch (err) {
      alert('Error deleting certification');
    }
  };

  const handleDeleteLicense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this license?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/profile/license/${id}`);
      fetchProfile();
    } catch (err) {
      alert('Error deleting license');
    }
  };

  const handleDeleteShortCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/profile/course/${id}`);
      fetchProfile();
    } catch (err) {
      alert('Error deleting short course');
    }
  };

  const handleDeleteEmployment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employment record?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/profile/employment/${id}`);
      fetchProfile();
    } catch (err) {
      alert('Error deleting employment record');
    }
  };

  // --- UPDATE HANDLERS ---
  const handleUpdateDegree = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/profile/degree/${id}`, editingDegree);
      setEditingDegree(null); fetchProfile();
    } catch (err) { alert('Error updating degree'); }
  };

  const handleUpdateCert = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/profile/certification/${id}`, editingCert);
      setEditingCert(null); fetchProfile();
    } catch (err) { alert('Error updating certification'); }
  };

  const handleUpdateLicense = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/profile/license/${id}`, editingLicense);
      setEditingLicense(null); fetchProfile();
    } catch (err) { alert('Error updating license'); }
  };

  const handleUpdateCourse = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/profile/course/${id}`, editingCourse);
      setEditingCourse(null); fetchProfile();
    } catch (err) { alert('Error updating course'); }
  };

  const handleUpdateEmployment = async (e, id) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/profile/employment/${id}`, editingEmployment);
      setEditingEmployment(null); fetchProfile();
    } catch (err) { alert('Error updating employment'); }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
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

      <BiddingSystem />

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
              <li key={index} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                {editingDegree?.id === deg.id ? (
                  <form className="inline-form" onSubmit={(e) => handleUpdateDegree(e, deg.id)} style={{width: '100%', marginBottom: '10px'}}>
                    <input type="text" value={editingDegree.degree_name} onChange={e => setEditingDegree({...editingDegree, degree_name: e.target.value})} required />
                    <input type="url" value={editingDegree.university_url} onChange={e => setEditingDegree({...editingDegree, university_url: e.target.value})} required />
                    <input type="date" value={formatDateForInput(editingDegree.completion_date)} onChange={e => setEditingDegree({...editingDegree, completion_date: e.target.value})} required />
                    <button type="submit" className="btn-primary" style={{padding: '0.4rem'}}>Save</button>
                    <button type="button" onClick={() => setEditingDegree(null)} className="btn-secondary" style={{padding: '0.4rem'}}>Cancel</button>
                  </form>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div className="item-details">
                      <strong>{deg.degree_name}</strong>
                      <span>{new Date(deg.completion_date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a href={deg.university_url} target="_blank" rel="noopener noreferrer" className="link-btn">University Link</a>
                      <button onClick={() => setEditingDegree(deg)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteDegree(deg.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
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
              <li key={index} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                {editingCert?.id === cert.id ? (
                  <form className="inline-form" onSubmit={(e) => handleUpdateCert(e, cert.id)} style={{width: '100%', marginBottom: '10px'}}>
                    <input type="text" value={editingCert.cert_name} onChange={e => setEditingCert({...editingCert, cert_name: e.target.value})} required />
                    <input type="url" value={editingCert.course_url} onChange={e => setEditingCert({...editingCert, course_url: e.target.value})} required />
                    <input type="date" value={formatDateForInput(editingCert.completion_date || cert.issue_date)} onChange={e => setEditingCert({...editingCert, completion_date: e.target.value})} required />
                    <button type="submit" className="btn-primary" style={{padding: '0.4rem'}}>Save</button>
                    <button type="button" onClick={() => setEditingCert(null)} className="btn-secondary" style={{padding: '0.4rem'}}>Cancel</button>
                  </form>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div className="item-details">
                      <strong>{cert.cert_name}</strong>
                      <span>{new Date(cert.completion_date || cert.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a href={cert.course_url} target="_blank" rel="noopener noreferrer" className="link-btn">Course Link</a>
                      <button onClick={() => setEditingCert(cert)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteCertification(cert.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
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
              <li key={index} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                {editingLicense?.id === lic.id ? (
                  <form className="inline-form" onSubmit={(e) => handleUpdateLicense(e, lic.id)} style={{width: '100%', marginBottom: '10px'}}>
                    <input type="text" value={editingLicense.license_name} onChange={e => setEditingLicense({...editingLicense, license_name: e.target.value})} required />
                    <input type="url" value={editingLicense.awarding_body_url} onChange={e => setEditingLicense({...editingLicense, awarding_body_url: e.target.value})} required />
                    <input type="date" value={formatDateForInput(editingLicense.completion_date)} onChange={e => setEditingLicense({...editingLicense, completion_date: e.target.value})} required />
                    <button type="submit" className="btn-primary" style={{padding: '0.4rem'}}>Save</button>
                    <button type="button" onClick={() => setEditingLicense(null)} className="btn-secondary" style={{padding: '0.4rem'}}>Cancel</button>
                  </form>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div className="item-details">
                      <strong>{lic.license_name}</strong>
                      <span>{new Date(lic.completion_date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a href={lic.awarding_body_url} target="_blank" rel="noopener noreferrer" className="link-btn">Awarding Body</a>
                      <button onClick={() => setEditingLicense(lic)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteLicense(lic.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
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
              <li key={index} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                {editingCourse?.id === course.id ? (
                  <form className="inline-form" onSubmit={(e) => handleUpdateCourse(e, course.id)} style={{width: '100%', marginBottom: '10px'}}>
                    <input type="text" value={editingCourse.course_name} onChange={e => setEditingCourse({...editingCourse, course_name: e.target.value})} required />
                    <input type="url" value={editingCourse.course_url} onChange={e => setEditingCourse({...editingCourse, course_url: e.target.value})} required />
                    <input type="date" value={formatDateForInput(editingCourse.completion_date)} onChange={e => setEditingCourse({...editingCourse, completion_date: e.target.value})} required />
                    <button type="submit" className="btn-primary" style={{padding: '0.4rem'}}>Save</button>
                    <button type="button" onClick={() => setEditingCourse(null)} className="btn-secondary" style={{padding: '0.4rem'}}>Cancel</button>
                  </form>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div className="item-details">
                      <strong>{course.course_name}</strong>
                      <span>{new Date(course.completion_date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a href={course.course_url} target="_blank" rel="noopener noreferrer" className="link-btn">Course Link</a>
                      <button onClick={() => setEditingCourse(course)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteShortCourse(course.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
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
              <li key={index} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                {editingEmployment?.id === job.id ? (
                  <form className="inline-form" onSubmit={(e) => handleUpdateEmployment(e, job.id)} style={{width: '100%', marginBottom: '10px', flexWrap: 'wrap'}}>
                    <input type="text" value={editingEmployment.job_title} onChange={e => setEditingEmployment({...editingEmployment, job_title: e.target.value})} required style={{flex: 1, minWidth: '150px'}}/>
                    <input type="text" value={editingEmployment.company_name} onChange={e => setEditingEmployment({...editingEmployment, company_name: e.target.value})} required style={{flex: 1, minWidth: '150px'}}/>
                    <input type="date" value={formatDateForInput(editingEmployment.start_date)} onChange={e => setEditingEmployment({...editingEmployment, start_date: e.target.value})} required />
                    <input type="date" value={formatDateForInput(editingEmployment.end_date)} onChange={e => setEditingEmployment({...editingEmployment, end_date: e.target.value})} />
                    <button type="submit" className="btn-primary" style={{padding: '0.4rem'}}>Save</button>
                    <button type="button" onClick={() => setEditingEmployment(null)} className="btn-secondary" style={{padding: '0.4rem'}}>Cancel</button>
                  </form>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div className="item-details">
                      <strong>{job.job_title}</strong>
                      <span>{job.company_name}</span>
                      <span style={{color: '#646cff'}}>
                        {new Date(job.start_date).toLocaleDateString()} - {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button onClick={() => setEditingEmployment(job)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteEmployment(job.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                )}
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