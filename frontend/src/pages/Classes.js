import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: 'Primary',
    code: '',
    academic_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/classes/');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/classes/', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        level: 'Primary',
        code: '',
        academic_year: new Date().getFullYear().toString(),
      });
      fetchClasses();
      alert('Class added successfully!');
    } catch (error) {
      console.error('Failed to add class:', error);
      alert('Failed to add class. Please check the form.');
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
        <h1 className="text-3xl font-bold text-gray-800">Classes</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                <p className="text-gray-500">Code: {cls.code}</p>
                <p className="text-gray-500">Level: {cls.level}</p>
                <p className="text-gray-500">Year: {cls.academic_year}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {cls.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No classes found. Add your first class!
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Class</h2>
            <form onSubmit={handleAddClass} className="space-y-4">
              <input
                type="text"
                placeholder="Class Name * (e.g., Primary 1)"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="Primary">Primary</option>
                <option value="JHS">JHS</option>
              </select>
              <input
                type="text"
                placeholder="Class Code * (e.g., P1, J1)"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <input
                type="text"
                placeholder="Academic Year * (e.g., 2024)"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              />
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Add Class
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

export default Classes;