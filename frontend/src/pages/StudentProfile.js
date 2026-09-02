import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [parents, setParents] = useState([]);
  const [linkedParents, setLinkedParents] = useState([]);
  const [showLinkParentModal, setShowLinkParentModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [relationshipType, setRelationshipType] = useState('guardian');

  useEffect(() => {
    fetchStudentData();
    fetchParents();
    fetchLinkedParents();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const [studentRes, marksRes, attendanceRes, paymentsRes] = await Promise.all([
        api.get(`/api/students/${id}`),
        api.get(`/api/grades/?student_id=${id}`),
        api.get(`/api/attendance/?student_id=${id}`),
        api.get(`/api/fees/?student_id=${id}`),
      ]);

      setStudent(studentRes.data);
      setMarks(marksRes.data);
      setAttendance(attendanceRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await api.get('/api/parents/');
      setParents(response.data);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    }
  };

  const fetchLinkedParents = async () => {
    try {
      // ✅ Correct endpoint
      const response = await api.get(`/api/parent-students/students/${id}/parents`);
      setLinkedParents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch linked parents:', error);
      setLinkedParents([]);
    }
  };

  const handleLinkParent = async () => {
    if (!selectedParentId) {
      alert('Please select a parent.');
      return;
    }

    try {
      await api.post(`/api/parent-students/students/${id}/link-parent`, null, {
        params: {
          parent_id: parseInt(selectedParentId),
          relationship: relationshipType
        }
      });
      
      setShowLinkParentModal(false);
      setSelectedParentId('');
      setRelationshipType('guardian');
      fetchLinkedParents();
      alert('Parent linked successfully!');
    } catch (error) {
      console.error('Failed to link parent:', error);
      alert('Failed to link parent. Please try again.');
    }
  };

  const handleUnlinkParent = async (parentId) => {
    if (window.confirm('Are you sure you want to unlink this parent?')) {
      try {
        await api.delete(`/api/parent-students/students/${id}/unlink-parent/${parentId}`);
        fetchLinkedParents();
        alert('Parent unlinked successfully!');
      } catch (error) {
        console.error('Failed to unlink parent:', error);
        alert('Failed to unlink parent. Please try again.');
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/students/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchStudentData();
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploading(false);
    }
  };

  // Filter out already linked parents
  const availableParents = parents.filter(
    parent => !linkedParents.some(lp => lp.id === parent.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/students')}
        className="mb-6 text-primary hover:text-blue-700 flex items-center gap-2"
      >
        ← Back to Students
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-8">
          <div className="relative">
            {student.photo ? (
              <img
                src={`http://localhost:8000/uploads/${student.photo}`}
                alt={student.user.full_name}
                className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-6xl border-4 border-gray-200">
                {student.user.full_name.charAt(0)}
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

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{student.user.full_name}</h1>
            <p className="text-gray-500">Admission: {student.admission_number}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><span className="text-gray-500">Class:</span> {student.current_class?.name || 'N/A'}</div>
              <div><span className="text-gray-500">Grade:</span> {student.grade || 'N/A'}</div>
              <div><span className="text-gray-500">Email:</span> {student.user.email}</div>
              <div><span className="text-gray-500">Phone:</span> {student.user.phone || 'N/A'}</div>
              <div><span className="text-gray-500">Guardian:</span> {student.guardian_name || 'N/A'}</div>
              <div><span className="text-gray-500">Guardian Phone:</span> {student.guardian_phone || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Parent Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">👨‍👩‍👧 Parents/Guardians</h2>
          <button
            onClick={() => setShowLinkParentModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Link Parent
          </button>
        </div>

        {linkedParents.length > 0 ? (
          <div className="space-y-2">
            {linkedParents.map((parent) => (
              <div key={parent.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium text-gray-800">{parent.user?.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {parent.relationship_type || 'Guardian'} • {parent.user?.email || 'No email'}
                  </p>
                </div>
                <button
                  onClick={() => handleUnlinkParent(parent.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No parents linked to this student.</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Marks</h3>
          <p className="text-2xl font-bold text-gray-800">{marks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Attendance</h3>
          <p className="text-2xl font-bold text-gray-800">{attendance.length} days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Payments</h3>
          <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Performance</h2>
        {marks.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Term</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark.id} className="border-t">
                  <td className="px-4 py-2">{mark.subject?.name || 'N/A'}</td>
                  <td className="px-4 py-2">{mark.term}</td>
                  <td className="px-4 py-2">{mark.score}%</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mark.grade === 'A' ? 'bg-green-100 text-green-700' :
                      mark.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      mark.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {mark.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No marks recorded yet.</p>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Fee Payments</h2>
        {payments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Term</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Paid</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-4 py-2">{payment.term}</td>
                  <td className="px-4 py-2">₵{payment.amount}</td>
                  <td className="px-4 py-2">₵{payment.amount_paid}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No payments recorded yet.</p>
        )}
      </div>

      {/* Link Parent Modal */}
      {showLinkParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Link Parent/Guardian</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Parent/Guardian *
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                >
                  <option value="">Select a parent...</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.user?.full_name} ({parent.user?.email || 'No email'})
                    </option>
                  ))}
                </select>
                {availableParents.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No parents available to link. 
                    <button 
                      onClick={() => navigate('/parents')}
                      className="text-primary hover:underline ml-1"
                    >
                      Add a parent first
                    </button>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                >
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="guardian">Guardian</option>
                  <option value="stepmother">Stepmother</option>
                  <option value="stepfather">Stepfather</option>
                  <option value="aunt">Aunt</option>
                  <option value="uncle">Uncle</option>
                  <option value="grandparent">Grandparent</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleLinkParent}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Link Parent
                </button>
                <button
                  onClick={() => {
                    setShowLinkParentModal(false);
                    setSelectedParentId('');
                    setRelationshipType('guardian');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;