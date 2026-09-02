import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    class_name: '',
    day: 'Monday',
    period: '',
    subject: '',
    room: '',
    start_time: '',
    end_time: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = Array.from({ length: 8 }, (_, i) => i + 1);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await api.get('/api/timetable/');
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/timetable/', {
        ...formData,
        period: parseInt(formData.period),
        teacher_id: 1, // Default teacher ID
      });

      setShowAddModal(false);
      setFormData({
        class_name: '',
        day: 'Monday',
        period: '',
        subject: '',
        room: '',
        start_time: '',
        end_time: '',
      });
      fetchTimetable();
      alert('Timetable entry added successfully!');
    } catch (error) {
      console.error('Failed to add timetable entry:', error);
      alert('Failed to add timetable entry. Please check the form.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group timetable by class and day
  const groupedTimetable = timetable.reduce((acc, entry) => {
    const key = `${entry.class_name}-${entry.day}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Timetable</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedTimetable).map(([key, entries]) => {
          const [className, day] = key.split('-');
          return (
            <div key={key} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {className} - {day}
              </h3>
              <div className="space-y-2">
                {entries.sort((a, b) => a.period - b.period).map((entry) => (
                  <div key={entry.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Period {entry.period}</span>
                      <span className="text-gray-600">{entry.start_time} - {entry.end_time}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{entry.subject}</span>
                      {entry.room && <span className="text-gray-500 ml-2">Room: {entry.room}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(groupedTimetable).length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No timetable entries found.
          </div>
        )}
      </div>

      {/* Add Timetable Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Timetable Entry</h2>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Class Name *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                >
                  <option value="">Select Period *</option>
                  {periods.map((p) => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Subject *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Room"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    placeholder="Start Time"
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                  <input
                    type="time"
                    placeholder="End Time"
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  Add Entry
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

export default Timetable;