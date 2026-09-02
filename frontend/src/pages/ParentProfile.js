import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ParentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, [id]);

  const fetchParentData = async () => {
    try {
      const parentRes = await api.get(`/api/parents/${id}`);
      setParent(parentRes.data);
      
      const childrenRes = await api.get(`/api/parents/${id}/children`);
      setChildren(childrenRes.data.children || []);
    } catch (error) {
      console.error('Failed to fetch parent data:', error);
      navigate('/parents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!parent) {
    return <div>Parent not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/parents')}
        className="mb-6 text-primary hover:text-blue-700 flex items-center gap-2"
      >
        ← Back to Parents
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold">
            {parent.user?.full_name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{parent.user?.full_name || 'N/A'}</h1>
            <p className="text-gray-500">Parent</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><span className="text-gray-500">Email:</span> {parent.user?.email || 'N/A'}</div>
              <div><span className="text-gray-500">Phone:</span> {parent.user?.phone || 'N/A'}</div>
              <div><span className="text-gray-500">Occupation:</span> {parent.occupation || 'N/A'}</div>
              <div><span className="text-gray-500">Address:</span> {parent.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">👨‍🎓 Children</h2>
        {children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <div key={child.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center space-x-3">
                  {child.photo ? (
                    <img
                      src={`http://localhost:8000/uploads/${child.photo}`}
                      alt={child.user?.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                      {child.user?.full_name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{child.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{child.admission_number} • {child.current_class?.name || 'No class'}</p>
                    <p className="text-sm text-gray-500">Grade: {child.grade || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/students/${child.id}`)}
                    className="text-primary hover:text-blue-700 font-medium text-sm"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No children linked to this parent.</p>
        )}
      </div>
    </div>
  );
};

export default ParentProfile;