import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { api, getErrorMessage } from '../lib/api';
import BlogManagement from '../components/admin/BlogManagement';
import VideoManagement from '../components/admin/VideoManagement';
import CourseManagement from '../components/admin/CourseManagement';
import UserManagement from '../components/admin/UserManagement';
import { User } from '../types';
import '../styles/AdminDashboard.css';

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
      setStats(prev => ({ 
        ...prev, 
        totalUsers: prev.totalUsers || 156, 
        pendingApprovals: prev.pendingApprovals || 12, 
        activeUsers: prev.activeUsers || 89,
        totalSubjects: prev.totalSubjects || 18
      }));
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res: any = await api.get('/users');
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <div className="admin-loading-text">Chargement du tableau de bord...</div>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'courses', label: 'Cours', icon: '📚' },
    { id: 'videos', label: 'Vidéos', icon: '🎥' },
    { id: 'blog', label: 'Blog', icon: '📝' },
    { id: 'users', label: 'Utilisateurs', icon: '👥' }
  ];

  const recentActivities = [
    { id: 1, type: 'user', title: 'Nouvel utilisateur inscrit', description: 'Marie Dubois s\'est inscrite', time: '2 min', icon: '👤' },
    { id: 2, type: 'course', title: 'Cours publié', description: 'Droit des contrats - Module 3', time: '15 min', icon: '📚' },
    { id: 3, type: 'video', title: 'Vidéo ajoutée', description: 'Introduction au droit civil', time: '1h', icon: '🎥' },
    { id: 4, type: 'blog', title: 'Article publié', description: 'Réforme du code civil 2024', time: '2h', icon: '📝' }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Professional Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo-section">
            <img 
              src="/images/logo.png" 
              alt="Clinique Juriste" 
              className="admin-logo"
            />
            <div className="admin-title-section">
              <h1>Administration</h1>
              <p>Clinique des Juristes</p>
            </div>
          </div>

          <div className="admin-user-section">
            <div className="admin-user-info">
              <p className="admin-user-name">{user?.name || 'Administrateur'}</p>
              <p className="admin-user-role">Super Admin</p>
            </div>
            <button onClick={logout} className="admin-logout-btn">
              <span>↗</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-main-content">
        {/* Professional Navigation */}
        <div className="admin-nav-container">
          <nav className="admin-nav-tabs">
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`admin-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="admin-nav-tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Tableau de bord</h2>
              <p className="admin-section-subtitle">
                Vue d'ensemble de votre plateforme d'éducation juridique
              </p>
            </div>

            <div className="admin-section-content">
              {/* Quick Actions */}
              <div className="admin-quick-actions">
                <button className="admin-quick-action primary" onClick={() => setActiveTab('courses')}>
                  <span>➕</span>
                  <span>Nouveau cours</span>
                </button>
                <button className="admin-quick-action" onClick={() => setActiveTab('blog')}>
                  <span>✍️</span>
                  <span>Rédiger article</span>
                </button>
                <button className="admin-quick-action" onClick={() => setActiveTab('users')}>
                  <span>👤</span>
                  <span>Gérer utilisateurs</span>
                </button>
                <button className="admin-quick-action" onClick={() => setActiveTab('videos')}>
                  <span>📹</span>
                  <span>Ajouter vidéo</span>
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">Utilisateurs totaux</div>
                      <div className="admin-stat-number">{stats.totalUsers.toLocaleString()}</div>
                      <div className="admin-stat-trend">
                        <span>↗️</span>
                        <span>+12% ce mois</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon users">👥</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">Cours disponibles</div>
                      <div className="admin-stat-number">{stats.totalCourses}</div>
                      <div className="admin-stat-trend">
                        <span>📈</span>
                        <span>+{stats.totalCourses} cours actifs</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon courses">📚</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">Contenu vidéo</div>
                      <div className="admin-stat-number">{stats.totalVideos}</div>
                      <div className="admin-stat-trend">
                        <span>🎬</span>
                        <span>Heures de contenu</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon videos">🎥</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">Articles publiés</div>
                      <div className="admin-stat-number">{stats.totalPosts}</div>
                      <div className="admin-stat-trend">
                        <span>📖</span>
                        <span>Publications récentes</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon blog">📝</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">En attente</div>
                      <div className="admin-stat-number">{stats.pendingApprovals}</div>
                      <div className="admin-stat-trend negative">
                        <span>⏳</span>
                        <span>Approbations requises</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon pending">⚠️</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-content">
                      <div className="admin-stat-label">Matières juridiques</div>
                      <div className="admin-stat-number">{stats.totalSubjects}</div>
                      <div className="admin-stat-trend">
                        <span>⚖️</span>
                        <span>Disciplines couvertes</span>
                      </div>
                    </div>
                    <div className="admin-stat-icon subjects">📖</div>
                  </div>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="admin-overview-grid">
                <div className="admin-overview-card">
                  <h3 className="admin-overview-title">
                    <span>📊</span>
                    <span>Statistiques clés</span>
                  </h3>
                  <ul className="admin-overview-list">
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Utilisateurs actifs</span>
                      <span className="admin-overview-item-value">{stats.activeUsers}</span>
                    </li>
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Taux de complétion</span>
                      <span className="admin-overview-item-value">78%</span>
                    </li>
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Note moyenne</span>
                      <span className="admin-overview-item-value">4.6/5</span>
                    </li>
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Temps moyen/session</span>
                      <span className="admin-overview-item-value">45 min</span>
                    </li>
                  </ul>
                </div>

                <div className="admin-overview-card">
                  <h3 className="admin-overview-title">
                    <span>🎯</span>
                    <span>Objectifs mensuels</span>
                  </h3>
                  <ul className="admin-overview-list">
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Nouveaux utilisateurs</span>
                      <span className="admin-overview-item-value">
                        <span className="admin-status-badge success">89/100</span>
                      </span>
                    </li>
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Cours publiés</span>
                      <span className="admin-overview-item-value">
                        <span className="admin-status-badge warning">3/5</span>
                      </span>
                    </li>
                    <li className="admin-overview-item">
                      <span className="admin-overview-item-label">Articles blog</span>
                      <span className="admin-overview-item-value">
                        <span className="admin-status-badge success">8/8</span>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="admin-overview-card">
                  <h3 className="admin-overview-title">
                    <span>📈</span>
                    <span>Activité récente</span>
                  </h3>
                  <div className="admin-activity-timeline">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="admin-activity-item">
                        <div className="admin-activity-icon" style={{
                          background: activity.type === 'user' ? '#dbeafe' : 
                                     activity.type === 'course' ? '#dcfce7' :
                                     activity.type === 'video' ? '#f3e8ff' : '#fef3c7'
                        }}>
                          {activity.icon}
                        </div>
                        <div className="admin-activity-content">
                          <div className="admin-activity-title">{activity.title}</div>
                          <div className="admin-activity-description">{activity.description}</div>
                          <div className="admin-activity-time">Il y a {activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Management */}
        {activeTab === 'courses' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Gestion des cours</h2>
              <p className="admin-section-subtitle">
                Créer, modifier et organiser le contenu pédagogique
              </p>
            </div>
            <div className="admin-section-content">
              <CourseManagement />
            </div>
          </div>
        )}

        {/* Blog Management */}
        {activeTab === 'blog' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Gestion du blog</h2>
              <p className="admin-section-subtitle">
                Publier et gérer les articles et actualités juridiques
              </p>
            </div>
            <div className="admin-section-content">
              <BlogManagement />
            </div>
          </div>
        )}

        {/* Video Management */}
        {activeTab === 'videos' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Gestion des vidéos</h2>
              <p className="admin-section-subtitle">
                Télécharger et organiser le contenu vidéo éducatif
              </p>
            </div>
            <div className="admin-section-content">
              <VideoManagement />
            </div>
          </div>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <div className="admin-content-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Gestion des utilisateurs</h2>
              <p className="admin-section-subtitle">
                Administrer les comptes étudiants et permissions
              </p>
            </div>
            <div className="admin-section-content">
              <UserManagement 
                users={users} 
                onCreateUser={handleCreateUser} 
                onApproveUser={handleApproveUser} 
                onEditUser={handleEditUser} 
                onDeleteUser={handleDeleteUser} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;