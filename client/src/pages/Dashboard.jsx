import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import './Dashboard.css';

const Dashboard = () => {
  const dashboardRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    programme: '',
    graduationDate: '',
    industrySector: ''
  });
  
  const [analytics, setAnalytics] = useState({
    skillsGap: [],
    industryEmployment: [],
    employmentTrends: [],
    topEmployers: [],
    certificationsByCategory: [],
    alumniByGraduationYear: [],
    sectorDemand: [],
    coursesPopularity: [],
    // Added summaryMetrics state
    summaryMetrics: { totalAlumni: 0, totalCertifications: 0, topIndustry: 'N/A' }
  });

  // Expanded color palette for the new charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(filters).toString();

      const response = await api.get(`/api/analytics?${query}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
        }
      });

      setAnalytics({
        skillsGap: response.data.skillsGap || [],
        industryEmployment: response.data.industryEmployment || [],
        employmentTrends: response.data.employmentTrends || [],
        topEmployers: response.data.topEmployers || [],
        certificationsByCategory: response.data.certificationsByCategory || [],
        alumniByGraduationYear: response.data.alumniByGraduationYear || [],
        sectorDemand: response.data.sectorDemand || [],
        coursesPopularity: response.data.coursesPopularity || [],
        // Capture the new summary metrics from the backend
        summaryMetrics: response.data.summaryMetrics || { totalAlumni: 0, totalCertifications: 0, topIndustry: 'N/A' }
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const exportPDF = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2 }); // Improved quality
    const data = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('University-Analytics-Report.pdf');
  };

  const exportCSV = () => {
    const csvData = [
      ...analytics.skillsGap.map(item => ({ chart: 'skillsGap', ...item })),
      ...analytics.industryEmployment.map(item => ({ chart: 'industryEmployment', ...item })),
      ...analytics.employmentTrends.map(item => ({ chart: 'employmentTrends', ...item })),
      ...analytics.topEmployers.map(item => ({ chart: 'topEmployers', ...item })),
      ...analytics.certificationsByCategory.map(item => ({ chart: 'certificationsByCategory', ...item })),
      ...analytics.alumniByGraduationYear.map(item => ({ chart: 'alumniByGraduationYear', ...item })),
      ...analytics.sectorDemand.map(item => ({ chart: 'sectorDemand', ...item })),
      ...analytics.coursesPopularity.map(item => ({ chart: 'coursesPopularity', ...item }))
    ];
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Analytics_Data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>University Analytics & Intelligence</h1>
        <div className="export-buttons">
          <button onClick={exportCSV} className="btn-secondary">Export CSV</button>
          <button onClick={exportPDF} className="btn-primary">Generate PDF Report</button>
        </div>
      </header>

      <section className="filters-section">
        <select name="programme" value={filters.programme} onChange={handleFilterChange}>
          <option value="">All Programmes</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Business Management">Business Management</option>
        </select>

        <select name="graduationDate" value={filters.graduationDate} onChange={handleFilterChange}>
          <option value="">All Years</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>

        <select name="industrySector" value={filters.industrySector} onChange={handleFilterChange}>
          <option value="">All Industries</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
        </select>
      </section>

      {loading && <p>Loading Analytics...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div ref={dashboardRef}>
          
          {/* NEW: Top Level Summary Cards */}
          <div className="summary-cards-container">
            <div className="stat-card">
              <h3>Total Alumni</h3>
              <div className="stat-number">{analytics.summaryMetrics?.totalAlumni || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Total Certifications</h3>
              <div className="stat-number">{analytics.summaryMetrics?.totalCertifications || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Top Industry</h3>
              <div className="stat-number" style={{ fontSize: '1.5rem', color: '#646cff' }}>
                {analytics.summaryMetrics?.topIndustry || 'N/A'}
              </div>
            </div>
          </div>

          <div className="charts-grid">
            
            <div className="chart-card">
              <h3>Curriculum vs Alumni Skills Gap</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analytics.skillsGap}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="University Taught" dataKey="university" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Alumni Acquired" dataKey="alumni" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Employment by Industry Sector</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={analytics.industryEmployment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {analytics.industryEmployment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Post-Graduation Certification Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.employmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" name="Employed" dataKey="employed" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  <Line type="monotone" name="Certified" dataKey="certified" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Top Employers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topEmployers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="employer" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Alumni Count" dataKey="alumni_count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Certifications by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={analytics.certificationsByCategory} dataKey="value" nameKey="category" innerRadius={60} outerRadius={110} label>
                    {analytics.certificationsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Alumni by Graduation Year</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.alumniByGraduationYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" name="Total Alumni" dataKey="total" stroke="#ffc658" fill="#ffc658" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Sector Demand</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={analytics.sectorDemand} margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="sector" type="category" width={100} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Demand" dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Popular Courses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.coursesPopularity}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Popularity" dataKey="value" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
                  <RechartsTooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;