import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Fees = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    term: 'Term 1',
    academic_year: new Date().getFullYear().toString(),
    amount: '',
    amount_paid: '',
    status: 'pending',
    payment_date: '',
    payment_method: '',
    notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    id: '',
    student_id: '',
    term: 'Term 1',
    academic_year: new Date().getFullYear().toString(),
    amount: '',
    amount_paid: '',
    status: 'pending',
    payment_date: '',
    payment_method: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/api/fees/');
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
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

  // ✅ FIXED: Add academic_year to payment data
  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        student_id: parseInt(formData.student_id),
        term: formData.term,
        academic_year: formData.academic_year || new Date().getFullYear().toString(),
        amount: parseFloat(formData.amount),
        amount_paid: parseFloat(formData.amount_paid) || 0,
        status: formData.status,
        payment_date: formData.payment_date || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      console.log('Sending payment data:', paymentData);

      await api.post('/api/fees/', paymentData);

      setShowAddModal(false);
      setFormData({
        student_id: '',
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
        amount: '',
        amount_paid: '',
        status: 'pending',
        payment_date: '',
        payment_method: '',
        notes: '',
      });
      fetchPayments();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Failed to add payment:', error);
      if (error.response) {
        console.error('Error data:', error.response.data);
        alert(`Failed to record payment: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to record payment. Please check the form.');
      }
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setEditFormData({
      id: payment.id,
      student_id: payment.student_id,
      term: payment.term,
      academic_year: payment.academic_year || new Date().getFullYear().toString(),
      amount: payment.amount,
      amount_paid: payment.amount_paid || 0,
      status: payment.status,
      payment_date: payment.payment_date || '',
      payment_method: payment.payment_method || '',
      notes: payment.notes || '',
    });
    setShowEditModal(true);
  };

  // ✅ FIXED: Add academic_year to update data
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/fees/${editFormData.id}`, {
        student_id: parseInt(editFormData.student_id),
        term: editFormData.term,
        academic_year: editFormData.academic_year || new Date().getFullYear().toString(),
        amount: parseFloat(editFormData.amount),
        amount_paid: parseFloat(editFormData.amount_paid) || 0,
        status: editFormData.status,
        payment_date: editFormData.payment_date || null,
        payment_method: editFormData.payment_method || null,
        notes: editFormData.notes || null,
      });

      setShowEditModal(false);
      setEditingPayment(null);
      setEditFormData({
        id: '',
        student_id: '',
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
        amount: '',
        amount_paid: '',
        status: 'pending',
        payment_date: '',
        payment_method: '',
        notes: '',
      });
      fetchPayments();
      alert('Payment updated successfully!');
    } catch (error) {
      console.error('Failed to update payment:', error);
      alert('Failed to update payment. Please check the form.');
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await api.delete(`/api/fees/${id}`);
        fetchPayments();
        alert('Payment record deleted successfully!');
      } catch (error) {
        console.error('Failed to delete payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
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
        <h1 className="text-3xl font-bold text-gray-800">Fee Management</h1>
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
            + Record Payment
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {payment.student?.user?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-gray-600">{payment.term}</td>
                <td className="px-6 py-4 text-gray-600">₵{payment.amount}</td>
                <td className="px-6 py-4 text-gray-600">₵{payment.amount_paid || 0}</td>
                <td className="px-6 py-4">
                  <span className={getStatusBadge(payment.status)}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEditPayment(payment)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No payments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Record Payment</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
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
                  placeholder="Amount *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Amount Paid"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                />
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input
                  type="date"
                  placeholder="Payment Date"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Payment Method (cash/bank/mobile)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Record Payment
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

      {/* Edit Payment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Payment</h2>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
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
                  placeholder="Amount *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Amount Paid"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.amount_paid}
                  onChange={(e) => setEditFormData({ ...editFormData, amount_paid: e.target.value })}
                />
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input
                  type="date"
                  placeholder="Payment Date"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.payment_date}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Payment Method (cash/bank/mobile)"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.payment_method}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Update Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayment(null);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔍 Student Fee Lookup</h2>
            
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
                  const studentPayments = payments.filter(p => p.student_id === student.id);
                  const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
                  const totalDue = studentPayments.reduce((sum, p) => sum + p.amount, 0);
                  
                  return (
                    <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800">{student.user?.full_name || 'Unknown'}</h3>
                          <p className="text-gray-500 text-sm">Admission: {student.admission_number}</p>
                          <p className="text-gray-500 text-sm">Class: {student.current_class?.name || 'No class'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Paid: <span className="font-bold text-green-600">₵{totalPaid}</span></p>
                          <p className="text-sm text-gray-500">Total Due: <span className="font-bold text-red-600">₵{totalDue}</span></p>
                          <p className="text-sm text-gray-500">Balance: <span className={`font-bold ${totalDue - totalPaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₵{(totalDue - totalPaid).toFixed(2)}
                          </span></p>
                        </div>
                      </div>
                      {studentPayments.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Payment History:</p>
                          <div className="space-y-1 mt-1">
                            {studentPayments.map((payment) => (
                              <div key={payment.id} className="flex justify-between text-sm border-b pb-1">
                                <span>{payment.term}</span>
                                <span>₵{payment.amount_paid || 0} paid</span>
                                <span className={getStatusBadge(payment.status)}>{payment.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm mt-2">No payments recorded for this student.</p>
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

export default Fees;