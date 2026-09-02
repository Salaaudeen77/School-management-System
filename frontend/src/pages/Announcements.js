import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'all',
    is_published: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/announcements/');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/announcements/', formData);
      setShowAddModal(false);
      setFormData({
        title: '',
        content: '',
        audience: 'all',
        is_published: true,
      });
      fetchAnnouncements();
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement. Please check the form.');
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await api.post(`/api/announcements/${id}/publish`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/api/announcements/${id}`);
        fetchAnnouncements();
      } catch (error) {
        console.error('Failed to delete announcement:', error);
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
        <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Create Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                <p className="text-gray-600 mt-2">{announcement.content}</p>
                <div className="flex items-center mt-4 space-x-4">
                  <span className="text-sm text-gray-500">
                    By {announcement.author?.full_name || 'Unknown'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    announcement.audience === 'all' ? 'bg-gray-100 text-gray-700' :
                    announcement.audience === 'students' ? 'bg-blue-100 text-blue-700' :
                    announcement.audience === 'teachers' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {announcement.audience}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    announcement.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {announcement.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTogglePublish(announcement.id, announcement.is_published)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    announcement.is_published
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {announcement.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No announcements found.
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Announcement</h2>
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <input
                type="text"
                placeholder="Title *"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                placeholder="Content *"
                required
                rows="5"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="parents">Parents Only</option>
              </select>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  className="mr-2"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <label htmlFor="is_published">Publish immediately</label>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Create Announcement
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

export default Announcements;