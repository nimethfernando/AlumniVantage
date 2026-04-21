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
    employmentTrends: [],
    topEmployers: [],
    certificationsByCategory: [],
    alumniByGraduationYear: [],
    sectorDemand: [],
    coursesPopularity: [],
    summaryMetrics: { totalAlumni: 0, totalCertifications: 0, topIndustry: 'N/A' }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/api/alumni/filter-options', {
        headers: {
          'x-api-key': import.meta.env.VITE_ANALYTICS_API_KEY
        }
      });

      setFilterOptions({
        programmes: response.data.programmes || [],
        graduationYears: response.data.graduationYears || [],
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
        employmentTrends: response.data.employmentTrends || [],
        topEmployers: response.data.topEmployers || [],
        certificationsByCategory: response.data.certificationsByCategory || [],
        alumniByGraduationYear: response.data.alumniByGraduationYear || [],
        sectorDemand: response.data.sectorDemand || [],
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
        ...analytics.employmentTrends.map((item) => ({ chart: 'employmentTrends', ...item })),
        ...analytics.topEmployers.map((item) => ({ chart: 'topEmployers', ...item })),
        ...analytics.certificationsByCategory.map((item) => ({ chart: 'certificationsByCategory', ...item })),
        ...analytics.alumniByGraduationYear.map((item) => ({ chart: 'alumniByGraduationYear', ...item })),
        ...analytics.sectorDemand.map((item) => ({ chart: 'sectorDemand', ...item })),
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
              <h3>Curriculum vs Alumni Skills Gap (Radar Chart)</h3>
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
              <p className="chart-insight">
                This chart highlights gaps between what the university teaches and what alumni later acquire independently, helping identify skills that may need to be integrated into the curriculum earlier.
              </p>
            </div>

            <div className="chart-card">
              <h3>Employment by Industry Sector (Pie Chart)</h3>
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
                This chart shows where graduates are being employed most heavily, helping the university identify which industry sectors currently absorb the largest share of alumni talent.
              </p>
            </div>

            <div className="chart-card">
              <h3>Post-Graduation Certification Trends (Line Chart)</h3>
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
              <p className="chart-insight">
                Growth in alumni certifications after graduation suggests changing industry expectations and shows which professional areas are becoming more important over time.
              </p>
            </div>

            <div className="chart-card">
              <h3>Top Employers (Bar Chart)</h3>
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
                This chart reveals which employers recruit the most graduates, giving the university evidence of strong employer relationships and dominant hiring destinations.
              </p>
            </div>

            <div className="chart-card">
              <h3>Certifications by Category (Doughnut Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.certificationsByCategory}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    label
                  >
                    {analytics.certificationsByCategory.map((entry, index) => (
                      <Cell key={`cert-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="chart-insight">
                This doughnut chart shows the most common certification areas pursued by alumni, indicating where graduates feel they must strengthen their skills after university.
              </p>
            </div>

            <div className="chart-card">
              <h3>Alumni by Graduation Year (Area Chart)</h3>
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
              <p className="chart-insight">
                This chart shows how alumni records are distributed by graduation year, helping compare trends across different graduating cohorts.
              </p>
            </div>

            <div className="chart-card">
              <h3>Sector Demand (Bar Chart)</h3>
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
              <p className="chart-insight">
                This chart highlights the roles or sectors with the strongest alumni presence, helping the university track labour market demand and emerging professional directions.
              </p>
            </div>

            <div className="chart-card">
              <h3>Popular Courses (Radar Chart)</h3>
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
              <p className="chart-insight">
                This chart shows the most commonly completed post-graduation courses, revealing which workplace skills alumni are most often forced to learn independently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;