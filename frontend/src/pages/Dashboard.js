import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    payments: 0,
    attendance: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchStats();
  }, []);

  const fetchStats = async () => {
  try {
    const token = localStorage.getItem('access_token');
    console.log('Dashboard - Token:', token);
    
    // Use allSettled so one failure doesn't break everything
    const results = await Promise.allSettled([
      api.get('/api/students/count'),
      api.get('/api/teachers/count'),
      api.get('/api/fees/total'),  // This might fail, but won't break everything
      api.get('/api/attendance/?limit=100'),
      api.get('/api/students/?limit=5&sort_by=created_at&order=desc'),
    ]);

    // Extract data from successful results
    const studentsCount = results[0].status === 'fulfilled' ? results[0].value.data.count : 0;
    const teachersCount = results[1].status === 'fulfilled' ? results[1].value.data.count : 0;
    const feesTotal = results[2].status === 'fulfilled' ? results[2].value.data.total : 0;
    const attendanceData = results[3].status === 'fulfilled' ? results[3].value.data : [];
    const recentStudents = results[4].status === 'fulfilled' ? results[4].value.data : [];

    console.log('Students count:', studentsCount);
    console.log('Teachers count:', teachersCount);
    console.log('Fees total:', feesTotal);
    console.log('Attendance:', attendanceData);
    console.log('Recent students:', recentStudents);

    // Calculate attendance percentage
    let attendancePercent = 0;
    if (attendanceData && attendanceData.length > 0) {
      const present = attendanceData.filter(a => a.status === 'present').length;
      attendancePercent = Math.round((present / attendanceData.length) * 100);
    }

    setStats({
      students: studentsCount,
      teachers: teachersCount,
      payments: feesTotal,
      attendance: attendancePercent,
    });

    setRecentStudents(recentStudents);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    setStats({
      students: 0,
      teachers: 0,
      payments: 0,
      attendance: 0,
    });
    setRecentStudents([]);
  } finally {
    setLoading(false);
  }
};
  // Role-based cards
  const adminCards = [
  { title: 'Students', value: stats.students, icon: '👨‍🎓', color: 'bg-blue-500' },
  { title: 'Teachers', value: stats.teachers, icon: '👨‍🏫', color: 'bg-green-500' },
  { title: 'Total Payments', value: `₵${stats.payments.toFixed(2)}`, icon: '💰', color: 'bg-amber-500' },
  { title: 'Attendance Rate', value: `${stats.attendance}%`, icon: '📊', color: 'bg-purple-500' },
];

  const teacherCards = [
    { title: 'My Students', value: stats.students || 0, icon: '👨‍🎓', color: 'bg-blue-500' },
    { title: 'Attendance Rate', value: `${stats.attendance}%`, icon: '📊', color: 'bg-purple-500' },
    { title: 'My Classes', value: '3', icon: '📚', color: 'bg-green-500' },
    { title: 'Today\'s Attendance', value: '85%', icon: '📝', color: 'bg-amber-500' },
  ];

  const studentCards = [
    { title: 'My Grade', value: 'A', icon: '⭐', color: 'bg-blue-500' },
    { title: 'Attendance Rate', value: `${stats.attendance}%`, icon: '📊', color: 'bg-purple-500' },
    { title: 'Fee Status', value: 'Paid', icon: '💰', color: 'bg-green-500' },
    { title: 'Upcoming Tests', value: '2', icon: '📝', color: 'bg-amber-500' },
  ];

  const parentCards = [
    { title: 'My Children', value: '1', icon: '👨‍👩‍👧', color: 'bg-blue-500' },
    { title: 'Attendance Rate', value: `${stats.attendance}%`, icon: '📊', color: 'bg-purple-500' },
    { title: 'Fee Status', value: 'Paid', icon: '💰', color: 'bg-green-500' },
    { title: 'Recent Grades', value: 'A', icon: '⭐', color: 'bg-amber-500' },
  ];

  let cards = adminCards;
  if (user?.role === 'teacher') {
    cards = teacherCards;
  } else if (user?.role === 'student') {
    cards = studentCards;
  } else if (user?.role === 'parent') {
    cards = parentCards;
  }

  // Quick actions
  const adminActions = [
    { title: 'Add New Student', path: '/students', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { title: 'Record Payment', path: '/fees', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
    { title: 'Mark Attendance', path: '/attendance', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  ];

  const teacherActions = [
    { title: 'Mark Attendance', path: '/attendance', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    { title: 'Enter Grades', path: '/grades', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { title: 'View Students', path: '/students', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  ];

  const studentActions = [
    { title: 'View My Grades', path: '/grades', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { title: 'View Attendance', path: '/attendance', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    { title: 'View Timetable', path: '/timetable', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  ];

  const parentActions = [
    { title: 'View Children', path: '/students', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { title: 'Check Fees', path: '/fees', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
    { title: 'View Announcements', path: '/announcements', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  ];

  let quickActions = adminActions;
  if (user?.role === 'teacher') {
    quickActions = teacherActions;
  } else if (user?.role === 'student') {
    quickActions = studentActions;
  } else if (user?.role === 'parent') {
    quickActions = parentActions;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  let greeting = 'Welcome to the School Management System!';
  if (user?.role === 'teacher') {
    greeting = `Welcome, Teacher ${user.full_name || ''}! You can mark attendance and enter grades.`;
  } else if (user?.role === 'student') {
    greeting = `Welcome, Student ${user.full_name || ''}! Track your grades and attendance.`;
  } else if (user?.role === 'parent') {
    greeting = `Welcome, Parent ${user.full_name || ''}! Monitor your child's progress.`;
  } else if (user?.role === 'admin') {
    greeting = `Welcome, Admin ${user.full_name || ''}! You have full access to the system.`;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-primary">
        <p className="text-gray-700">{greeting}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <span className="text-white text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Students</h2>
          {recentStudents.length > 0 ? (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center space-x-3">
                    {student.photo ? (
                      <img
                        src={`http://localhost:8000/uploads/${student.photo}`}
                        alt={student.user?.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {student.user?.full_name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{student.user?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {student.admission_number} • {student.current_class?.name || 'No class'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No students added yet.</p>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`w-full text-left px-4 py-3 ${action.color} rounded-lg transition`}
            >
              {action.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;