import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    class_id: "",
    academic_year: new Date().getFullYear().toString(),
    grade: "",
    admission_number: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/api/students/");
      setStudents(response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/api/classes/");
      setClasses(response.data);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length >= 2) {
      try {
        const response = await api.get(`/api/students/search/?q=${term}`);
        setStudents(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      }
    } else if (term.length === 0) {
      fetchStudents();
    }
  };

  const handleViewStudent = (id) => {
    navigate(`/students/${id}`);
  };

  const handleDeleteStudent = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this student? This action cannot be undone.",
      )
    ) {
      try {
        await api.delete(`/api/students/${id}`);
        fetchStudents();
        alert("Student deleted successfully!");
      } catch (error) {
        console.error("Failed to delete student:", error);
        alert("Failed to delete student. Please try again.");
      }
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const userResponse = await api.post("/api/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || "",
        role: "student",
      });

      console.log("User created:", userResponse.data);

      await api.post("/api/students/", {
        user_id: userResponse.data.id,
        class_id: parseInt(formData.class_id),
        academic_year: formData.academic_year,
        admission_number: formData.admission_number || "",
        guardian_name: formData.guardian_name || "",
        guardian_phone: formData.guardian_phone || "",
        guardian_email: formData.guardian_email || "",
      });

      setShowAddModal(false);
      setFormData({
        full_name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        class_id: "",
        academic_year: new Date().getFullYear().toString(),
        grade: "",
        admission_number: "",
        guardian_name: "",
        guardian_phone: "",
        guardian_email: "",
      });
      fetchStudents();
      alert("Student added successfully!");
    } catch (error) {
      console.error("Failed to add student:", error);
      if (error.response) {
        console.error("Error data:", error.response.data);
        alert(`Failed to add student: ${JSON.stringify(error.response.data)}`);
      } else {
        alert("Failed to add student. Please check the form.");
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
        <h1 className="text-3xl font-bold text-gray-800">Students</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search students by name or admission number..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admission No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  {student.photo ? (
                    <img
                      src={`http://localhost:8000/uploads/${student.photo}`}
                      alt={student.user?.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                      {student.user?.full_name?.charAt(0) || "S"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {student.user?.full_name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {student.admission_number}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {student.current_class?.name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {student.grade || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewStudent(student.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm
                    ? "No students found matching your search."
                    : "No students found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Add New Student
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Username *"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password *"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Admission Number (leave blank for auto-generation)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.admission_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admission_number: e.target.value,
                    })
                  }
                />
                <select
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.class_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_id: e.target.value })
                  }
                >
                  <option value="">Select Class *</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Academic Year * (e.g., 2024)"
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.academic_year}
                  onChange={(e) =>
                    setFormData({ ...formData, academic_year: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Grade (e.g., A, B, C)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Guardian Name"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.guardian_name}
                  onChange={(e) =>
                    setFormData({ ...formData, guardian_name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Guardian Phone"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.guardian_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, guardian_phone: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Guardian Email"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  value={formData.guardian_email}
                  onChange={(e) =>
                    setFormData({ ...formData, guardian_email: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Student
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

export default Students;
