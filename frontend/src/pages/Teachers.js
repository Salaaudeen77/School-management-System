import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    employee_id: "",
    subject: "",
    qualification: "",
    experience: "",
    department: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/api/teachers/");
      setTeachers(response.data);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      // Log the data being sent
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || "",
        role: "teacher",
      };
      console.log("Register data:", userData);

      // Step 1: Create the user
      const userResponse = await api.post("/api/auth/register", userData);
      console.log("User created:", userResponse.data);

      // Step 2: Create the teacher profile
      const teacherData = {
        user_id: userResponse.data.id,
        employee_id: formData.employee_id,
        subject: formData.subject,
        qualification: formData.qualification || "",
        experience: parseInt(formData.experience) || 0,
        department: formData.department || "",
      };
      console.log("Teacher data:", teacherData);

      await api.post("/api/teachers/", teacherData);

      setShowAddModal(false);
      setFormData({
        full_name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        employee_id: "",
        subject: "",
        qualification: "",
        experience: "",
        department: "",
      });
      fetchTeachers();
      alert("Teacher added successfully!");
    } catch (error) {
      console.error("Failed to add teacher:", error);
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);

        let errorMessage = "Failed to add teacher: ";
        if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else if (typeof error.response.data === "string") {
          errorMessage += error.response.data;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }
        alert(errorMessage);
      } else {
        alert("Failed to add teacher. Please check the form.");
      }
    }
  };

  const handleViewTeacher = (id) => {
    navigate(`/teachers/${id}`);
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/api/teachers/${id}`);
        fetchTeachers();
        alert("Teacher deleted successfully!");
      } catch (error) {
        console.error("Failed to delete teacher:", error);
        alert("Failed to delete teacher. Please try again.");
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
        <h1 className="text-3xl font-bold text-gray-800">Teachers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Employee ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {teacher.user?.full_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {teacher.employee_id}
                </td>
                <td className="px-6 py-4 text-gray-600">{teacher.subject}</td>
                <td className="px-6 py-4 text-gray-600">
                  {teacher.department || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewTeacher(teacher.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    View
                  </button>{" "}
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Add New Teacher
            </h2>
            <form onSubmit={handleAddTeacher} className="space-y-4">
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
                  placeholder="Employee ID (leave blank for auto-generation)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Subject *"
                  required
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Qualification"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Years of Experience"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Department"
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
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
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Teacher
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

export default Teachers;
