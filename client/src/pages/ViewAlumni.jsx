import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import '../App.css';

const ViewAlumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [filters, setFilters] = useState({
    programme: '',
    graduationYear: '',
    sector: ''
  });
  const [options, setOptions] = useState({
    programmes: [],
    graduationYears: [],
    sectors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get('/api/alumni/filter-options', {
        headers: {
          'x-api-key': import.meta.env.VITE_ALUMNI_API_KEY
        }
      });
      setOptions({
        programmes: res.data.programmes || [],
        graduationYears: res.data.graduationYears || [],
        sectors: res.data.sectors || []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load filter options.');
    }
  };

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.programme) params.append('programme', filters.programme);
      if (filters.graduationYear) params.append('graduationYear', filters.graduationYear);
      if (filters.sector) params.append('sector', filters.sector);

      const res = await api.get(`/api/alumni?${params.toString()}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_ALUMNI_API_KEY
        }
      });

      setAlumni(res.data.alumni || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAlumni();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Updated to use first_name and last_name, falling back to email
  const getDisplayName = (item) => {
    if (item.first_name || item.last_name) {
      return `${item.first_name || ''} ${item.last_name || ''}`.trim();
    }
    if (!item.email) return 'Alumni';
    return item.email.split('@')[0];
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1>View Alumni</h1>
        <p>Browse alumni by programme, graduation year, and industry sector.</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}
        >
          <select name="programme" value={filters.programme} onChange={handleChange}>
            <option value="">All Programmes</option>
            {options.programmes.map((programme, index) => (
              <option key={index} value={programme}>
                {programme}
              </option>
            ))}
          </select>

          <select name="graduationYear" value={filters.graduationYear} onChange={handleChange}>
            <option value="">All Graduation Years</option>
            {options.graduationYears.map((year, index) => (
              <option key={index} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select name="sector" value={filters.sector} onChange={handleChange}>
            <option value="">All Industry Sectors</option>
            {options.sectors.map((sector, index) => (
              <option key={index} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>Loading alumni...</p>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {alumni.length > 0 ? (
            alumni.map((item, index) => (
              <div key={index} className="card">
                {item.profile_image_url && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img
                      src={`http://localhost:3000${item.profile_image_url}`}
                      alt="Profile"
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #e2e8f0'
                      }}
                    />
                  </div>
                )}
                {/* Updated to pass the entire item object */}
                <h3>{getDisplayName(item)}</h3>
                <p><strong>Programme:</strong> {item.degree_name || 'N/A'}</p>
                <p><strong>Graduation Year:</strong> {item.graduation_year || 'N/A'}</p>
                <p><strong>Company:</strong> {item.company || 'N/A'}</p>
                <p><strong>Industry Sector:</strong> {item.industry_sector || 'N/A'}</p>
                <p><strong>Bio:</strong> {item.bio || 'No bio available'}</p>
                {item.linkedin_url && (
                  <a href={item.linkedin_url} target="_blank" rel="noreferrer">
                    View LinkedIn
                  </a>
                )}
              </div>
            ))
          ) : (
            <p>No alumni found for the selected filters.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewAlumni;