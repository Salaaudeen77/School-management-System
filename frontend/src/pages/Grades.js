import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Grades = () => {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    subject_id: '',
    term: 'Term 1',
    academic_year: new Date().getFullYear().toString(),  // ✅ Added
    score: '',
    grade: '',
    remarks: '',
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    student_id: '',
    subject_id: '',
    term: 'Term 1',
    academic_year: new Date().getFullYear().toString(),  // ✅ Added
    score: '',
    grade: '',
    remarks: '',
  });

  useEffect(() => {
    fetchMarks();
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchMarks = async () => {
    try {
      const response = await api.get('/api/grades/');
      setMarks(response.data);
    } catch (error) {
      console.error('Failed to fetch marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students/');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      // ✅ Fetch subjects from the API
      const response = await api.get('/api/subjects/');
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      // Fallback to empty array
      setSubjects([]);
    }
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    try {
      const gradeData = {
        student_id: parseInt(formData.student_id),
        subject_id: parseInt(formData.subject_id),
        term: formData.term,
        academic_year: formData.academic_year || new Date().getFullYear().toString(),  // ✅ Added
        score: parseFloat(formData.score),
        grade: formData.grade,
        remarks: formData.remarks || '',
      };

      console.log('Sending grade data:', gradeData);

      await api.post('/api/grades/', gradeData);

      setShowAddModal(false);
      setFormData({
        student_id: '',
        subject_id: '',
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
        score: '',
        grade: '',
        remarks: '',
      });
      fetchMarks();
      alert('Grade recorded successfully!');
    } catch (error) {
      console.error('Failed to record grade:', error);
      if (error.response) {
        console.error('Error data:', error.response.data);
        alert(`Failed to record grade: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to record grade. Please check the form.');
      }
    }
  };

  const handleEditMark = (mark) => {
    setEditingMark(mark);
    setEditFormData({
      id: mark.id,
      student_id: mark.student_id,
      subject_id: mark.subject_id,
      term: mark.term,
      academic_year: mark.academic_year || new Date().getFullYear().toString(),
      score: mark.score,
      grade: mark.grade,
      remarks: mark.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateMark = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/grades/${editFormData.id}`, {
        student_id: parseInt(editFormData.student_id),
        subject_id: parseInt(editFormData.subject_id),
        term: editFormData.term,
        academic_year: editFormData.academic_year || new Date().getFullYear().toString(),
        score: parseFloat(editFormData.score),
        grade: editFormData.grade,
        remarks: editFormData.remarks || '',
      });

      setShowEditModal(false);
      setEditingMark(null);
      setEditFormData({
        id: '',
        student_id: '',
        subject_id: '',
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
        score: '',
        grade: '',
        remarks: '',
      });
      fetchMarks();
      alert('Grade updated successfully!');
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade. Please check the form.');
    }
  };

  const handleDeleteMark = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await api.delete(`/api/grades/${id}`);
        fetchMarks();
        alert('Grade deleted successfully!');
      } catch (error) {
        console.error('Failed to delete grade:', error);
        alert('Failed to delete grade. Please try again.');
      }
    }
  };

  const calculateGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: 'bg-green-100 text-green-700',
      B: 'bg-blue-100 text-blue-700',
      C: 'bg-yellow-100 text-yellow-700',
      D: 'bg-orange-100 text-orange-700',
      F: 'bg-red-100 text-red-700',
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[grade] || 'bg-gray-100 text-gray-700'}`;
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
        <h1 className="text-3xl font-bold text-gray-800">Grades</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Grade
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {marks.map((mark) => (
              <tr key={mark.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {mark.student?.user?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {mark.subject?.name || `Subject ${mark.subject_id}`}
                </td>
                <td className="px-6 py-4 text-gray-600">{mark.term}</td>
                <td className="px-6 py-4 text-gray-600">{mark.score}%</td>
                <td className="px-6 py-4">
                  <span className={getGradeColor(mark.grade)}>
                    {mark.grade}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEditMark(mark)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMark(mark.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {marks.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No grades recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Grade</h2>
            <form onSubmit={handleAddMark} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                >
                  <option value="">Select Student *</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user?.full_name} ({student.admission_number})
                    </option>
                  ))}
                </select>
                <select
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                >
                  <option value="">Select Subject *</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
                <input
                  type="text"
                  placeholder="Academic Year (e.g., 2026)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Score (%) *"
                  required
                  min="0"
                  max="100"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.score}
                  onChange={(e) => {
                    const score = e.target.value;
                    const grade = calculateGrade(parseFloat(score));
                    setFormData({ ...formData, score, grade });
                  }}
                />
                <input
                  type="text"
                  placeholder="Grade"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 bg-gray-50"
                  value={formData.grade}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="Remarks"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Add Grade
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Grade</h2>
            <form onSubmit={handleUpdateMark} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.student_id}
                  onChange={(e) => setEditFormData({ ...editFormData, student_id: e.target.value })}
                >
                  <option value="">Select Student *</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user?.full_name} ({student.admission_number})
                    </option>
                  ))}
                </select>
                <select
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.subject_id}
                  onChange={(e) => setEditFormData({ ...editFormData, subject_id: e.target.value })}
                >
                  <option value="">Select Subject *</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.term}
                  onChange={(e) => setEditFormData({ ...editFormData, term: e.target.value })}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
                <input
                  type="text"
                  placeholder="Academic Year"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.academic_year}
                  onChange={(e) => setEditFormData({ ...editFormData, academic_year: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Score (%) *"
                  required
                  min="0"
                  max="100"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.score}
                  onChange={(e) => {
                    const score = e.target.value;
                    const grade = calculateGrade(parseFloat(score));
                    setEditFormData({ ...editFormData, score, grade });
                  }}
                />
                <input
                  type="text"
                  placeholder="Grade"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 bg-gray-50"
                  value={editFormData.grade}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="Remarks"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Update Grade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMark(null);
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
    </div>
  );
};

export default Grades;