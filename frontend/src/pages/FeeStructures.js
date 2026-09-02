import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FeeStructures = () => {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    class_id: '',
    term: 'Term 1',
    academic_year: new Date().getFullYear().toString(),
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchFees();
    fetchClasses();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await api.get('/api/fee-structures/');
      setFees(response.data);
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/classes/');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/fee-structures/', {
        ...formData,
        amount: parseFloat(formData.amount),
        class_id: parseInt(formData.class_id),
      });
      setShowAddModal(false);
      setFormData({
        class_id: '',
        term: 'Term 1',
        academic_year: new Date().getFullYear().toString(),
        amount: '',
        description: '',
      });
      fetchFees();
      alert('Fee structure added successfully!');
    } catch (error) {
      console.error('Failed to add fee:', error);
      alert('Failed to add fee structure. Please check the form.');
    }
  };

  const handleDeleteFee = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await api.delete(`/api/fee-structures/${id}`);
        fetchFees();
        alert('Fee structure deleted successfully!');
      } catch (error) {
        console.error('Failed to delete fee:', error);
        alert('Failed to delete fee structure.');
      }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fee Structures</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Fee Structure
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (₵)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fees.map((fee) => {
              const cls = classes.find(c => c.id === fee.class_id);
              return (
                <tr key={fee.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{cls?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{fee.term}</td>
                  <td className="px-6 py-4 text-gray-600">{fee.academic_year}</td>
                  <td className="px-6 py-4 text-gray-600 font-semibold">₵{fee.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{fee.description || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteFee(fee.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {fees.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No fee structures found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Fee Structure Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Fee Structure</h2>
            <form onSubmit={handleAddFee} className="space-y-4">
              <select
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              >
                <option value="">Select Class *</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
              <input
                type="text"
                placeholder="Academic Year * (e.g., 2024)"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              />
              <input
                type="number"
                placeholder="Amount (₵) *"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (e.g., Tuition Fee)"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Add Fee Structure
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
    </div>
  );
};

export default FeeStructures;