import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import './Dashboard.css'; // Reusing your existing dashboard styles

const AlumniDirectory = () => {
  const [filters, setFilters] = useState({
    programme: '',
    graduationYear: '',
    sector: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    programmes: [],
    graduationYears: [],
    sectors: []
  });

  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch dynamic filter options and initial alumni on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get('/api/alumni/filter-options', {
          headers: {
            'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
          }
        });
        setFilterOptions(response.data);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    
    fetchOptions();
    fetchAlumni(); // Load all alumni initially
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/api/alumni', {
        params: {
          programme: filters.programme,
          graduationYear: filters.graduationYear,
          sector: filters.sector
        },
        headers: {
          'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
        }
      });

      setAlumni(response.data.alumni || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch alumni directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleFilter = () => {
    fetchAlumni();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Alumni Directory</h1>
      </header>

      <section className="filters-section">
        <select name="programme" value={filters.programme} onChange={handleChange}>
          <option value="">All Programmes</option>
          {filterOptions.programmes.map((prog, idx) => (
            <option key={`prog-${idx}`} value={prog}>{prog}</option>
          ))}
        </select>

        <select name="graduationYear" value={filters.graduationYear} onChange={handleChange}>
          <option value="">All Years</option>
          {filterOptions.graduationYears.map((year, idx) => (
            <option key={`year-${idx}`} value={year}>{year}</option>
          ))}
        </select>

        <select name="sector" value={filters.sector} onChange={handleChange}>
          <option value="">All Sectors</option>
          {filterOptions.sectors.map((sector, idx) => (
            <option key={`sec-${idx}`} value={sector}>{sector}</option>
          ))}
        </select>

        <button onClick={handleFilter} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold' }}>
          Apply Filters
        </button>
      </section>

      {loading && <p>Loading alumni...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="charts-grid">
        {!loading && alumni.length === 0 && <p>No alumni found matching these filters.</p>}
        
        {alumni.map((person) => (
          <div key={`${person.user_id}-${person.degree_name}-${person.company || 'unknown'}`} className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
              {person.email}
            </h3>
            <p><strong>Programme:</strong> {person.degree_name || 'N/A'}</p>
            <p><strong>Graduation Year:</strong> {person.graduation_year || 'N/A'}</p>
            <p><strong>Sector:</strong> {person.industry_sector || 'N/A'}</p>
            <p><strong>Company:</strong> {person.company || 'N/A'}</p>
            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#555', flexGrow: 1 }}>
              {person.bio || 'No bio available.'}
            </p>
            {person.linkedin_url && (
              <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ marginTop: '15px', textAlign: 'center', textDecoration: 'none' }}>
                View LinkedIn
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlumniDirectory;