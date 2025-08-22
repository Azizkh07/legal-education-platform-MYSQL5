import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { api, getErrorMessage } from '../lib/api';
import BlogManagement from '../components/admin/BlogManagement';
import VideoManagement from '../components/admin/VideoManagement';
import CourseManagement from '../components/admin/CourseManagement';
import UserManagement from '../components/admin/UserManagement';
import { User } from '../types';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'blog' | 'videos' | 'users' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);

  // stats (keep local)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalVideos: 0,
    totalCourses: 0,
    totalSubjects: 0,
    pendingApprovals: 0,
    activeUsers: 0
  });

  // users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // attempt to fetch stats (safe)
      try {
        const videoData: any = await api.get('/videos/admin/stats');
        setStats(prev => ({ ...prev, totalVideos: videoData?.total_videos ?? prev.totalVideos }));
      } catch (e) { /* ignore */ }
      try {
        const blogData: any = await api.get('/blog/admin/stats');
        setStats(prev => ({ ...prev, totalPosts: blogData?.stats?.total_posts ?? prev.totalPosts }));
      } catch (e) { /* ignore */ }
      // courses
      try {
        const courseData: any = await api.get('/courses');
        if (Array.isArray(courseData)) setStats(prev => ({ ...prev, totalCourses: courseData.length }));
      } catch (e) { /* ignore */ }

      // placeholder minimal values when missing
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers || 0, pendingApprovals: prev.pendingApprovals || 0, activeUsers: prev.activeUsers || 0 }));
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res: any = await api.get('/users'); // becomes /api/users
      if (res && res.success && Array.isArray(res.users)) {
        setUsers(res.users);
        const pending = res.users.filter((u: User) => !u.is_approved).length;
        setStats(prev => ({ ...prev, totalUsers: res.users.length, pendingApprovals: pending }));
      } else if (Array.isArray(res)) {
        setUsers(res);
      } else {
        console.warn('Unexpected users response', res);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Helpers
  const generateEmailFromName = (name: string) => {
    const base = name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${base}.${suffix}@cliniquejuristes.com`;
  };
  const generatePassword = () => Math.random().toString(36).slice(-8) + 'A!';

  // Handlers
  const handleCreateUser = async (payload: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => {
    try {
      const name = payload.name;
      const email = payload.email && payload.email.trim() !== '' ? payload.email : generateEmailFromName(name);
      const password = payload.password && payload.password.trim() !== '' ? payload.password : generatePassword();
      const body = { name, email, password, isAdmin: payload.is_admin ?? false, isApproved: payload.is_approved ?? false };
      const res: any = await api.post('/users/create', body);
      if (res && res.success) {
        setUsers(prev => [res.user, ...prev]);
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1, pendingApprovals: prev.pendingApprovals + (res.user.is_approved ? 0 : 1) }));
        alert(`Compte créé\nEmail: ${res.credentials.email}\nMot de passe: ${res.credentials.password}`);
      } else {
        alert('Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(getErrorMessage(error));
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      const res: any = await api.put(`/users/${userId}/approve`, {});
      if (res && res.success) {
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, is_approved: true } : u)));
        setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));
        alert('Utilisateur approuvé');
      } else {
        alert('Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert(getErrorMessage(error));
    }
  };

  const handleEditUser = async (userId: number, updates: Partial<User>) => {
    try {
      const body: any = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.email !== undefined) body.email = updates.email;
      if ((updates as any).is_admin !== undefined) body.isAdmin = (updates as any).is_admin;
      if ((updates as any).is_approved !== undefined) body.isApproved = (updates as any).is_approved;

      const res: any = await api.put(`/users/${userId}`, body);
      if (res && res.success) {
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...res.user } : u)));
        alert('Utilisateur mis à jour');
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Update user error:', error);
      alert(getErrorMessage(error));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const res: any = await api.delete(`/users/${userId}`);
      if (res && res.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
        alert('Utilisateur supprimé');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert(getErrorMessage(error));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/images/logo.png" alt="Clinique Juriste" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Clinique Juriste - Panneau d'administration</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">👑 {user?.name || 'admin'}</p>
              <p className="text-xs text-gray-600">Administrateur</p>
            </div>
            <button onClick={logout} className="px-4 py-2 text-sm text-red-600">🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-2 shadow-sm border mb-8">
          <nav className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
              { id: 'courses', label: 'Cours & Matières', icon: '📚' },
              { id: 'videos', label: 'Vidéos', icon: '🎥' },
              { id: 'blog', label: 'Blog', icon: '📝' },
              { id: 'users', label: 'Utilisateurs', icon: '👥' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-3 rounded-xl ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>{tab.icon} <span className="ml-2">{tab.label}</span></button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* stats grid (kept simple) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded shadow">{stats.totalUsers} Users</div>
              <div className="bg-white p-6 rounded shadow">{stats.totalCourses} Courses</div>
              <div className="bg-white p-6 rounded shadow">{stats.totalVideos} Videos</div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && <CourseManagement />}
        {activeTab === 'blog' && <BlogManagement />}
        {activeTab === 'videos' && <VideoManagement />}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserManagement users={users} onCreateUser={handleCreateUser} onApproveUser={handleApproveUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />
          </div>
        )}

     
      </div>
    </div>
  );
};

export default AdminDashboard;