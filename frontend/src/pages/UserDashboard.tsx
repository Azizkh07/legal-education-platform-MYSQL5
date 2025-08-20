import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, EnrolledCourse, UserStats } from '../types';
import { api, handleApiResponse, getErrorMessage } from '../lib/api';
import Loading from '../components/Loading';

const UserDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userResponse, coursesResponse, statsResponse] = await Promise.all([
          api.get<User>('/user/profile'),
          api.get<EnrolledCourse[]>('/user/courses'),
          api.get<UserStats>('/user/stats')
        ]);

        setUser(handleApiResponse<User>(userResponse));
        setEnrolledCourses(handleApiResponse<EnrolledCourse[]>(coursesResponse));
        setStats(handleApiResponse<UserStats>(statsResponse));
      } catch (err) {
        setError(getErrorMessage(err));
        
        // Mock data
        setUser({
          id: 1,
          name: "Ahmed Medsaidabidi",
          email: "ahmed@example.com",
          is_admin: false,
          is_approved: true,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-16T14:06:44Z"
        });

        setEnrolledCourses([
          {
            id: 1,
            title: "القانون الدستوري المعاصر",
            description: "دراسة شاملة للقانون الدستوري والمبادئ الأساسية للدولة الحديثة",
            cover_image: "/api/placeholder/400/200",
            is_active: true,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            video_count: 15,
            enrolled_count: 234,
            enrollment_date: "2025-01-05T00:00:00Z",
            progress: 65,
            completed: false
          },
          {
            id: 2,
            title: "قانون العمل والضمان الاجتماعي",
            description: "التشريعات الحديثة لحماية العمال وحقوق أصحاب العمل",
            cover_image: "/api/placeholder/400/200",
            is_active: true,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            video_count: 12,
            enrolled_count: 189,
            enrollment_date: "2025-01-10T00:00:00Z",
            progress: 25,
            completed: false
          },
          {
            id: 3,
            title: "القانون التجاري والشركات",
            description: "أسس القانون التجاري وتنظيم الشركات في العصر الرقمي",
            cover_image: "/api/placeholder/400/200",
            is_active: true,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
            video_count: 18,
            enrolled_count: 156,
            enrollment_date: "2024-12-20T00:00:00Z",
            progress: 100,
            completed: true
          }
        ]);

        setStats({
          coursesEnrolled: 3,
          coursesCompleted: 1,
          totalWatchTime: 1247,
          certificatesEarned: 1
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-blue animate-gradient flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="loading-dots mx-auto mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-white text-xl animate-pulse">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <section className="bg-gradient-blue animate-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4 animate-slideInLeft">
                  👋 Bonjour, {user?.name}!
                </h1>
                <p className="text-xl text-shadow animate-slideInLeft" style={{animationDelay: '0.2s'}}>
                  Bienvenue dans votre espace d'apprentissage personnel
                </p>
              </div>
              <div className="text-6xl animate-bounce">
                🎓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: '📚',
                label: 'Cours Inscrits',
                value: stats?.coursesEnrolled || 0,
                color: 'text-blue-600',
                delay: '0.1s'
              },
              {
                icon: '✅',
                label: 'Cours Terminés',
                value: stats?.coursesCompleted || 0,
                color: 'text-green-600',
                delay: '0.2s'
              },
              {
                icon: '⏰',
                label: 'Temps d\'Étude',
                value: formatTime(stats?.totalWatchTime || 0),
                color: 'text-purple-600',
                delay: '0.3s'
              },
              {
                icon: '🏆',
                label: 'Certificats',
                value: stats?.certificatesEarned || 0,
                color: 'text-yellow-600',
                delay: '0.4s'
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="glass hover-lift animate-scaleUp"
                style={{animationDelay: stat.delay}}
              >
                <div className="p-6 text-center">
                  <div className={`text-4xl mb-4 animate-bounce ${stat.color}`} style={{animationDelay: stat.delay}}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gradient mb-8 animate-fadeIn">
            🚀 Actions Rapides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Explorer les Cours',
                description: 'Découvrez de nouveaux cours juridiques',
                link: '/courses',
                color: 'btn-primary-cool',
                delay: '0.1s'
              },
              {
                icon: '📰',
                title: 'Lire le Blog',
                description: 'Restez informé des actualités juridiques',
                link: '/blog',
                color: 'btn-success-cool',
                delay: '0.2s'
              },
              {
                icon: '📞',
                title: 'Nous Contacter',
                description: 'Besoin d\'aide ou de conseils?',
                link: '/contact',
                color: 'btn-danger-cool',
                delay: '0.3s'
              }
            ].map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="card-cool hover-lift animate-slideInLeft group block"
                style={{animationDelay: action.delay}}
              >
                <div className="text-center p-6">
                  <div className="text-4xl mb-4 animate-bounce group-hover:animate-pulse" style={{animationDelay: action.delay}}>
                    {action.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gradient transition-all">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {action.description}
                  </p>
                  <span className={`btn-cool ${action.color} hover-scale inline-block px-6 py-2`}>
                    Accéder
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* My Courses */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gradient animate-fadeIn">
              📖 Mes Cours
            </h2>
            <Link 
              to="/courses"
              className="btn-cool btn-primary-cool hover-scale animate-fadeIn"
            >
              🔍 Parcourir Plus de Cours
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 animate-slideInLeft">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <strong>Erreur de chargement:</strong> {error}
                  <br />
                  <small>Données de démonstration affichées</small>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrolledCourses.map((course, index) => (
              <div
                key={course.id}
                className="card-cool hover-lift animate-slideInRight group"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <img
                    src={course.cover_image || "/api/placeholder/400/200"}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    {course.completed ? (
                      <span className="glass px-3 py-1 text-white text-sm font-medium rounded-full bg-green-500">
                        ✅ Terminé
                      </span>
                    ) : (
                      <span className="glass px-3 py-1 text-white text-sm font-medium rounded-full bg-blue-500">
                        📚 En Cours
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 arabic-text group-hover:text-gradient transition-all">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 arabic-text line-clamp-2">
                    {course.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progression</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 animate-pulse"
                        style={{width: `${course.progress}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="animate-pulse">
                      🎥 {course.video_count} vidéos
                    </span>
                    <span className="animate-pulse">
                      📅 Inscrit le {new Date(course.enrollment_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Link
                      to={`/courses/${course.id}`}
                      className="btn-cool btn-primary-cool w-full hover-scale"
                    >
                      {course.completed ? '🏆 Revoir le Cours' : '▶️ Continuer'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {enrolledCourses.length === 0 && (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-6 animate-bounce">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun cours inscrit</h3>
              <p className="text-gray-600 mb-8">Commencez votre parcours d'apprentissage dès maintenant!</p>
              <Link
                to="/courses"
                className="btn-cool btn-primary-cool hover-scale px-8 py-4"
              >
                🚀 Découvrir les Cours
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gradient mb-8 animate-fadeIn">
            📈 Activité Récente
          </h2>
          
          <div className="card-cool hover-lift animate-slideInLeft">
            <div className="space-y-4">
              {[
                {
                  icon: '🎯',
                  action: 'Cours terminé',
                  details: 'القانون التجاري والشركات',
                  time: 'Il y a 2 jours',
                  color: 'text-green-600'
                },
                {
                  icon: '📖',
                  action: 'Nouvelle leçon',
                  details: 'القانون الدستوري المعاصر - الفصل 5',
                  time: 'Il y a 3 jours',
                  color: 'text-blue-600'
                },
                {
                  icon: '🏆',
                  action: 'Certificat obtenu',
                  details: 'القانون التجاري والشركات',
                  time: 'Il y a 5 jours',
                  color: 'text-yellow-600'
                },
                {
                  icon: '📚',
                  action: 'Inscription au cours',
                  details: 'قانون العمل والضمان الاجتماعي',
                  time: 'Il y a 1 semaine',
                  color: 'text-purple-600'
                }
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-slideInRight"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className={`text-2xl mr-4 animate-pulse ${activity.color}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.action}</div>
                    <div className="text-gray-600 arabic-text">{activity.details}</div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;