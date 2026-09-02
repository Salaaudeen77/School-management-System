import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    remarks: '',
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    student_id: '',
    date: '',
    status: 'present',
    remarks: '',
  });

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/api/attendance/');
      setAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/');
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleStudentSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term.length >= 2) {
      const filtered = students.filter(student =>
        student.user?.full_name?.toLowerCase().includes(term) ||
        student.admission_number?.toLowerCase().includes(term)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  };

  const handleStudentLookup = async (term) => {
    const searchTerm = term || studentSearchTerm;
    
    if (searchTerm.length < 2) {
      setStudentSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/students/search/?q=${searchTerm}`);
      setStudentSearchResults(response.data);
    } catch (error) {
      console.error('Student lookup failed:', error);
      setStudentSearchResults([]);
    }
  };

  // ✅ UPDATED: handleAddAttendance with teacher_id logic
  const handleAddAttendance = async (e) => {
    e.preventDefault();
    try {
      // Get the current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Prepare attendance data
      const attendanceData = {
        student_id: parseInt(formData.student_id),
        date: formData.date,
        status: formData.status,
        remarks: formData.remarks || '',
      };
      
      // Only add teacher_id if user is NOT admin (teacher role)
      // Admin can leave teacher_id null
      if (user.role !== 'admin') {
        attendanceData.teacher_id = 1; // Default teacher ID for non-admin
      }
      // For admin, we don't send teacher_id at all

      console.log('Sending attendance data:', attendanceData);

      await api.post('/api/attendance/', attendanceData);

      setShowAddModal(false);
      setFormData({
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: '',
      });
      fetchAttendance();
      alert('Attendance recorded successfully!');
    } catch (error) {
      console.error('Failed to record attendance:', error);
      if (error.response) {
        console.error('Error data:', error.response.data);
        alert(`Failed to record attendance: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to record attendance. Please check the form.');
      }
    }
  };

  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    setEditFormData({
      id: record.id,
      student_id: record.student_id,
      date: record.date || '',
      status: record.status,
      remarks: record.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updateData = {
        student_id: parseInt(editFormData.student_id),
        date: editFormData.date,
        status: editFormData.status,
        remarks: editFormData.remarks || '',
      };
      
      if (user.role !== 'admin') {
        updateData.teacher_id = 1;
      }

      await api.put(`/api/attendance/${editFormData.id}`, updateData);

      setShowEditModal(false);
      setEditingAttendance(null);
      setEditFormData({
        id: '',
        student_id: '',
        date: '',
        status: 'present',
        remarks: '',
      });
      fetchAttendance();
      alert('Attendance updated successfully!');
    } catch (error) {
      console.error('Failed to update attendance:', error);
      alert('Failed to update attendance. Please check the form.');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await api.delete(`/api/attendance/${id}`);
        fetchAttendance();
        alert('Attendance record deleted successfully!');
      } catch (error) {
        console.error('Failed to delete attendance:', error);
        alert('Failed to delete attendance. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      excused: 'bg-blue-100 text-blue-700',
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowStudentSearch(true);
              setStudentSearchResults([]);
              setStudentSearchTerm('');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            🔍 Lookup Student
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Mark Attendance
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendance.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {record.student?.user?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={getStatusBadge(record.status)}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{record.remarks || 'N/A'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEditAttendance(record)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAttendance(record.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {attendance.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mark Attendance</h2>
            <form onSubmit={handleAddAttendance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <input
                    type="text"
                    placeholder="Search student by name or admission number..."
                    value={searchTerm}
                    onChange={handleStudentSearch}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    required
                    size="5"
                    className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    value={formData.student_id}
                    onChange={(e) => {
                      setFormData({ ...formData, student_id: e.target.value });
                      const student = students.find(s => s.id === parseInt(e.target.value));
                      if (student) {
                        setSearchTerm(student.user?.full_name || '');
                      }
                    }}
                  >
                    <option value="">Select a student *</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.full_name} ({student.admission_number})
                      </option>
                    ))}
                  </select>
                  {filteredStudents.length === 0 && searchTerm.length > 0 && (
                    <p className="text-sm text-red-500 mt-1">No students found matching "{searchTerm}"</p>
                  )}
                </div>

                <input
                  type="date"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
                <input
                  type="text"
                  placeholder="Remarks"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 col-span-2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Mark Attendance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchTerm('');
                    setFilteredStudents(students);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Attendance</h2>
            <form onSubmit={handleUpdateAttendance} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    value={editFormData.student_id}
                    onChange={(e) => setEditFormData({ ...editFormData, student_id: e.target.value })}
                  >
                    <option value="">Select a student *</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.full_name} ({student.admission_number})
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="date"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
                <input
                  type="text"
                  placeholder="Remarks"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 col-span-2"
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Update Attendance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAttendance(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Lookup Modal */}
      {showStudentSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Student Attendance Lookup</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={studentSearchTerm}
                onChange={(e) => {
                  const term = e.target.value;
                  setStudentSearchTerm(term);
                  if (term.length >= 2) {
                    handleStudentLookup(term);
                  } else if (term.length === 0) {
                    setStudentSearchResults([]);
                  }
                }}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                onKeyPress={(e) => e.key === 'Enter' && handleStudentLookup(studentSearchTerm)}
              />
              <button
                onClick={() => handleStudentLookup(studentSearchTerm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>

            {studentSearchResults.length > 0 ? (
              <div className="space-y-4">
                {studentSearchResults.map((student) => {
                  const studentAttendance = attendance.filter(a => a.student_id === student.id);
                  const totalDays = studentAttendance.length;
                  const presentDays = studentAttendance.filter(a => a.status === 'present').length;
                  const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
                  const lateDays = studentAttendance.filter(a => a.status === 'late').length;
                  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                  
                  return (
                    <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800">{student.user?.full_name || 'Unknown'}</h3>
                          <p className="text-gray-500 text-sm">Admission: {student.admission_number}</p>
                          <p className="text-gray-500 text-sm">Class: {student.current_class?.name || 'No class'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Attendance Rate: <span className={`font-bold ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {attendanceRate}%
                          </span></p>
                          <p className="text-sm text-gray-500">Present: <span className="text-green-600">{presentDays}</span></p>
                          <p className="text-sm text-gray-500">Absent: <span className="text-red-600">{absentDays}</span></p>
                          <p className="text-sm text-gray-500">Late: <span className="text-yellow-600">{lateDays}</span></p>
                        </div>
                      </div>
                      {studentAttendance.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Recent Attendance:</p>
                          <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                            {studentAttendance.slice(0, 10).map((record) => (
                              <div key={record.id} className="flex justify-between text-sm border-b pb-1">
                                <span>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</span>
                                <span className={getStatusBadge(record.status)}>{record.status}</span>
                              </div>
                            ))}
                            {studentAttendance.length > 10 && (
                              <p className="text-xs text-gray-500">...and {studentAttendance.length - 10} more records</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm mt-2">No attendance records for this student.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : studentSearchTerm.length >= 2 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found matching "{studentSearchTerm}"</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Enter at least 2 characters to search for a student.</p>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowStudentSearch(false);
                  setStudentSearchResults([]);
                  setStudentSearchTerm('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;