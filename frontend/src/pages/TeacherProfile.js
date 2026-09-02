import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const fetchTeacherData = async () => {
    try {
      const teacherRes = await api.get(`/api/teachers/${id}`);
      setTeacher(teacherRes.data);
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
      navigate('/teachers');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/teachers/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTeacherData();
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/teachers')}
        className="mb-6 text-primary hover:text-blue-700 flex items-center gap-2"
      >
        ← Back to Teachers
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-8">
          {/* Photo */}
          <div className="relative">
            {teacher.photo ? (
              <img
                src={`http://localhost:8000/uploads/${teacher.photo}`}
                alt={teacher.user.full_name}
                className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-6xl border-4 border-gray-200">
                {teacher.user?.full_name?.charAt(0) || 'T'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {uploading && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-sm">Uploading...</div>}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{teacher.user?.full_name || 'N/A'}</h1>
            <p className="text-gray-500">Employee ID: {teacher.employee_id || 'N/A'}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><span className="text-gray-500">Subject:</span> {teacher.subject || 'N/A'}</div>
              <div><span className="text-gray-500">Department:</span> {teacher.department || 'N/A'}</div>
              <div><span className="text-gray-500">Qualification:</span> {teacher.qualification || 'N/A'}</div>
              <div><span className="text-gray-500">Experience:</span> {teacher.experience || 0} years</div>
              <div><span className="text-gray-500">Email:</span> {teacher.user?.email || 'N/A'}</div>
              <div><span className="text-gray-500">Phone:</span> {teacher.user?.phone || 'N/A'}</div>
              <div><span className="text-gray-500">Hire Date:</span> {teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Now using real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Classes Taught</h3>
          <p className="text-2xl font-bold text-gray-800">{teacher.classes_count || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Students</h3>
          <p className="text-2xl font-bold text-gray-800">{teacher.students_count || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Attendance Rate</h3>
          <p className="text-2xl font-bold text-gray-800">{teacher.attendance_rate || 0}%</p>
        </div>
      </div>

      {/* Teacher Details - Now using real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Classes & Subjects</h2>
          {teacher.classes && teacher.classes.length > 0 ? (
            <div className="space-y-2">
              {teacher.classes.map((cls, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{cls.name || `Class ${index + 1}`}</span>
                  <span className="text-gray-600">{cls.subject || teacher.subject}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No classes assigned yet.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          {teacher.recent_activity && teacher.recent_activity.length > 0 ? (
            <div className="space-y-2">
              {teacher.recent_activity.map((activity, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="text-gray-700">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;