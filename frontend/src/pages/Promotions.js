import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Promotions = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFromClass, setSelectedFromClass] = useState('');
  const [selectedToClass, setSelectedToClass] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchPromotionHistory();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/classes/');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const response = await api.get(`/api/students/class/${classId}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const fetchPromotionHistory = async () => {
    try {
      const response = await api.get('/api/promotions/');
      setPromotionHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch promotion history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedFromClass(classId);
    if (classId) {
      fetchStudents(classId);
    } else {
      setStudents([]);
    }
  };

  const handlePromoteAll = async () => {
    if (!selectedFromClass || !selectedToClass) {
      alert('Please select both classes.');
      return;
    }

    if (!window.confirm(`Are you sure you want to promote ALL students from ${classes.find(c => c.id === parseInt(selectedFromClass))?.name} to ${classes.find(c => c.id === parseInt(selectedToClass))?.name}?`)) {
      return;
    }

    try {
      const response = await api.post('/api/promotions/promote-all', {
        from_class_id: parseInt(selectedFromClass),
        to_class_id: parseInt(selectedToClass),
        academic_year: academicYear
      });
      alert(response.data.message);
      fetchPromotionHistory();
      fetchStudents(selectedFromClass);
    } catch (error) {
      console.error('Failed to promote students:', error);
      alert('Failed to promote students.');
    }
  };

  const handlePromoteSingle = async (studentId) => {
    if (!selectedToClass) {
      alert('Please select a destination class.');
      return;
    }

    if (!window.confirm(`Promote this student to ${classes.find(c => c.id === parseInt(selectedToClass))?.name}?`)) {
      return;
    }

    try {
      await api.post('/api/promotions/', {
        student_id: studentId,
        from_class_id: parseInt(selectedFromClass),
        to_class_id: parseInt(selectedToClass),
        academic_year: academicYear
      });
      alert('Student promoted successfully!');
      fetchPromotionHistory();
      fetchStudents(selectedFromClass);
    } catch (error) {
      console.error('Failed to promote student:', error);
      alert('Failed to promote student.');
    }
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Promotions</h1>

      {/* Promotion Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Class</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              value={selectedFromClass}
              onChange={handleClassChange}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Class</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              value={selectedToClass}
              onChange={(e) => setSelectedToClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handlePromoteAll}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Promote All Students
          </button>
        </div>
      </div>

      {/* Students List */}
      {selectedFromClass && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Students in {classes.find(c => c.id === parseInt(selectedFromClass))?.name}
          </h2>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Admission</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{student.user?.full_name}</td>
                      <td className="px-4 py-2">{student.admission_number}</td>
                      <td className="px-4 py-2">
                        {student.is_graduated ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Graduated</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {!student.is_graduated && selectedToClass && (
                          <button
                            onClick={() => handlePromoteSingle(student.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No students in this class.</p>
          )}
        </div>
      )}

      {/* Promotion History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Promotion History</h2>
        {promotionHistory.length > 0 ? (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">From</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Year</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotionHistory.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{promo.student?.user?.full_name}</td>
                    <td className="px-4 py-2">{promo.from_class?.name}</td>
                    <td className="px-4 py-2">{promo.to_class?.name}</td>
                    <td className="px-4 py-2">{promo.academic_year}</td>
                    <td className="px-4 py-2">{new Date(promo.promoted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No promotion history yet.</p>
        )}
      </div>
    </div>
  );
};

export default Promotions;