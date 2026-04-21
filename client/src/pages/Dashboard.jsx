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
    graduationYear: '',
    sector: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    programmes: [],
    graduationYears: [],
    sectors: []
  });

  const [analytics, setAnalytics] = useState({
    skillsGap: [],
    industryEmployment: [],
    jobTitles: [],
    topEmployers: [],
    locationDistribution: [],
    sectorDemand: [],
    certificationTrend: [],
    coursesPopularity: [],
    summaryMetrics: { totalAlumni: 0, totalCertifications: 0, topIndustry: 'N/A' }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      // Updated to match the new analytics filter route
      const response = await api.get('/api/analytics/filters', {
        headers: {
          'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
        }
      });

      setFilterOptions({
        programmes: response.data.programmes || [],
        graduationYears: response.data.years || [], // Mapped 'years' from backend to 'graduationYears'
        sectors: response.data.sectors || []
      });
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.programme) params.append('programme', filters.programme);
      if (filters.graduationYear) params.append('graduationYear', filters.graduationYear);
      if (filters.sector) params.append('sector', filters.sector);

      const response = await api.get(`/api/analytics?${params.toString()}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
        }
      });

      setAnalytics({
        skillsGap: response.data.skillsGap || [],
        industryEmployment: response.data.industryEmployment || [],
        jobTitles: response.data.jobTitles || [],
        topEmployers: response.data.topEmployers || [],
        locationDistribution: response.data.locationDistribution || [],
        sectorDemand: response.data.sectorDemand || [],
        certificationTrend: response.data.certificationTrend || [],
        coursesPopularity: response.data.coursesPopularity || [],
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
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const exportPDF = async () => {
    try {
      const element = dashboardRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const data = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProperties = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(data, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(data, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save('University-Analytics-Report.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('Failed to generate PDF report.');
    }
  };

  const exportCSV = () => {
    try {
      const csvData = [
        ...analytics.skillsGap.map((item) => ({ chart: 'skillsGap', ...item })),
        ...analytics.industryEmployment.map((item) => ({ chart: 'industryEmployment', ...item })),
        ...analytics.jobTitles.map((item) => ({ chart: 'jobTitles', ...item })),
        ...analytics.topEmployers.map((item) => ({ chart: 'topEmployers', ...item })),
        ...analytics.locationDistribution.map((item) => ({ chart: 'locationDistribution', ...item })),
        ...analytics.sectorDemand.map((item) => ({ chart: 'sectorDemand', ...item })),
        ...analytics.certificationTrend.map((item) => ({ chart: 'certificationTrend', ...item })),
        ...analytics.coursesPopularity.map((item) => ({ chart: 'coursesPopularity', ...item }))
      ];

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Analytics_Data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
      setError('Failed to export CSV.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>University Analytics & Intelligence</h1>
        <div className="export-buttons">
          <button onClick={exportCSV} className="btn-secondary" type="button">Export CSV</button>
          <button onClick={exportPDF} className="btn-primary" type="button">Generate PDF Report</button>
        </div>
      </header>

      <section className="filters-section">
        <select name="programme" value={filters.programme} onChange={handleFilterChange}>
          <option value="">All Programmes</option>
          {filterOptions.programmes.map((programme, index) => (
            <option key={index} value={programme}>
              {programme}
            </option>
          ))}
        </select>

        <select name="graduationYear" value={filters.graduationYear} onChange={handleFilterChange}>
          <option value="">All Years</option>
          {filterOptions.graduationYears.map((year, index) => (
            <option key={index} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select name="sector" value={filters.sector} onChange={handleFilterChange}>
          <option value="">All Industries</option>
          {filterOptions.sectors.map((sector, index) => (
            <option key={index} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </section>

      {loading && <p>Loading Analytics...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div ref={dashboardRef}>
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
              <h3>Curriculum Skill Gap Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analytics.skillsGap}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Curriculum" dataKey="university" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Alumni Demand" dataKey="alumni" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart compares curriculum coverage with skills alumni had to acquire after graduation, highlighting the strongest curriculum gaps.
              </p>
            </div>

            <div className="chart-card">
              <h3>Employment by Industry Sector</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.industryEmployment}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.industryEmployment.map((entry, index) => (
                      <Cell key={`industry-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart shows the main sectors where alumni are currently employed, helping identify where graduates are most often absorbed.
              </p>
            </div>

            <div className="chart-card">
              <h3>Most Common Job Titles</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={analytics.jobTitles} margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Alumni Count" dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart highlights the most common roles alumni now hold, revealing emerging career pathways and employment patterns.
              </p>
            </div>

            <div className="chart-card">
              <h3>Top Employers Hiring Alumni</h3>
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
              <p className="chart-insight">
                This chart identifies which employers recruit the most graduates, showing the organisations with the strongest alumni hiring presence.
              </p>
            </div>

            <div className="chart-card">
              <h3>Geographic Distribution of Alumni</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.locationDistribution}
                    dataKey="value"
                    nameKey="location"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    label
                  >
                    {analytics.locationDistribution.map((entry, index) => (
                      <Cell key={`location-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart shows where alumni are working geographically, helping the university understand its reach and international footprint.
              </p>
            </div>

            <div className="chart-card">
              <h3>Industry Demand by Sector</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.sectorDemand}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Demand" dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart shows the highest-demand sectors based on alumni employment concentration, helping guide curriculum planning decisions.
              </p>
            </div>

            <div className="chart-card">
              <h3>Certification Growth Trend (Last 6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.certificationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="AWS" stroke="#0088FE" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Azure" stroke="#00C49F" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="GCP" stroke="#FFBB28" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Docker" stroke="#FF8042" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart tracks recent growth in high-demand certifications, helping the university spot rapidly emerging industry needs.
              </p>
            </div>

            <div className="chart-card">
              <h3>Professional Development Trends (Courses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={analytics.coursesPopularity} margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="subject" type="category" width={140} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar name="Completions" dataKey="value" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This chart shows the most commonly completed post-graduation courses, indicating which workplace skills alumni most often learn independently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;