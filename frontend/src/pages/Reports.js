import React, { useState } from 'react';
import api from '../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('students');
  const [filters, setFilters] = useState({
    term: 'Term 1',
    class_name: '',
    date_from: '',
    date_to: '',
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'students':
          response = await api.get('/api/reports/students/', {
            params: { class_name: filters.class_name }
          });
          break;
        case 'teachers':
          response = await api.get('/api/reports/teachers/');
          break;
        case 'fees':
          response = await api.get('/api/reports/fees/', {
            params: { term: filters.term, class_name: filters.class_name }
          });
          break;
        case 'attendance':
          response = await api.get('/api/reports/attendance/', {
            params: {
              date_from: filters.date_from,
              date_to: filters.date_to,
              class_name: filters.class_name
            }
          });
          break;
        case 'grades':
          response = await api.get('/api/reports/grades/', {
            params: { term: filters.term, class_name: filters.class_name }
          });
          break;
        default:
          response = { data: { message: 'No data available' } };
      }
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    // Simple CSV export - you can enhance this
    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="students">Student Report</option>
              <option value="teachers">Teacher Report</option>
              <option value="fees">Fee Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="grades">Grade Report</option>
            </select>
          </div>

          {(reportType === 'students' || reportType === 'fees' || reportType === 'grades') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                type="text"
                placeholder="e.g., Grade 10A"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={filters.class_name}
                onChange={(e) => setFilters({ ...filters, class_name: e.target.value })}
              />
            </div>
          )}

          {(reportType === 'fees' || reportType === 'grades') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={filters.term}
                onChange={(e) => setFilters({ ...filters, term: e.target.value })}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          )}

          {reportType === 'attendance' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Export Data
            </button>
          )}
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Report Results</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Reports;