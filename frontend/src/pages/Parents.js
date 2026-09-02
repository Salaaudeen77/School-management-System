import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Parents = () => {
  const navigate = useNavigate(); // ✅ Add this
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    occupation: "",
    address: "",
  });

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await api.get("/api/parents/");
      setParents(response.data);
    } catch (error) {
      console.error("Failed to fetch parents:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add this function
  const handleViewParent = (id) => {
    navigate(`/parents/${id}`);
  };

  const handleDeleteParent = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this parent? This action cannot be undone.",
      )
    ) {
      try {
        await api.delete(`/api/parents/${id}`);
        fetchParents();
        alert("Parent deleted successfully!");
      } catch (error) {
        console.error("Failed to delete parent:", error);
        alert("Failed to delete parent. Please try again.");
      }
    }
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    try {
      const userResponse = await api.post("/api/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || "",
        role: "parent",
      });

      await api.post("/api/parents/", {
        user_id: userResponse.data.id,
        occupation: formData.occupation || "",
        address: formData.address || "",
      });

      setShowAddModal(false);
      setFormData({
        full_name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        occupation: "",
        address: "",
      });
      fetchParents();
      alert("Parent added successfully!");
    } catch (error) {
      console.error("Failed to add parent:", error);
      alert("Failed to add parent. Please check the form.");
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
        <h1 className="text-3xl font-bold text-gray-800">Parents</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Parent
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Occupation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parents.map((parent) => (
              <tr key={parent.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {parent.user?.full_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {parent.user?.email || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {parent.occupation || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {parent.user?.phone || "N/A"}
                </td>
                <td className="px-6 py-4">
                  {/* ✅ Updated View button with onClick */}
                  <button
                    onClick={() => handleViewParent(parent.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteParent(parent.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>{" "}
                </td>
              </tr>
            ))}
            {parents.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No parents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Add New Parent
            </h2>
            <form onSubmit={handleAddParent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Username *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Occupation"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 col-span-2"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Parent
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

export default Parents;
