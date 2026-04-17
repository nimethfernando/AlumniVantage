import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
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
  const [skillsData, setSkillsData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

      setSkillsData(response.data.skillsGap || []);
      setIndustryData(response.data.industryEmployment || []);
      setTrendData(response.data.employmentTrends || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setSkillsData([]);
      setIndustryData([]);
      setTrendData([]);
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
    const canvas = await html2canvas(element);
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
      ...skillsData.map(item => ({ chart: 'skillsGap', ...item })),
      ...industryData.map(item => ({ chart: 'industryEmployment', ...item })),
      ...trendData.map(item => ({ chart: 'employmentTrends', ...item }))
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
        <div className="charts-grid" ref={dashboardRef}>
          <div className="chart-card">
            <h3>Curriculum vs Alumni Skills Gap</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
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
                <Pie data={industryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {industryData.map((entry, index) => (
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
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="certified" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Overall Employment Track</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="employed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;