import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import Loading from '../components/Loading';

// Custom video interface
interface CourseVideo {
  id: number;
  title: string;
  description: string;
  duration?: number;
  course_id: number;
  created_at: string;
  updated_at: string;
  url?: string;
  order?: number;
  thumbnail?: string;
  is_free?: boolean;
  file_path?: string;
  is_active?: boolean;
}

// Custom course interface
interface CourseWithDetails {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  video_count?: number;
  enrolled_count: number;
  videos: CourseVideo[];
  instructor: {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
  };
  syllabus: string;
  requirements: string[];
  learning_outcomes: string[];
  reviews_count: number;
  average_rating: number;
  language: string;
  level: string;
  price?: number;
  discount_price?: number;
  certificate_included: boolean;
}

interface CourseReview {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'reviews' | 'instructor'>('overview');
  const [lastUpdated, setLastUpdated] = useState<string>("2025-08-18 20:28:23");

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Try to fetch from API
        try {
          // Create promises but don't await them yet
          const coursePromise = api.get(`/api/courses/${id}`);
          const enrollmentPromise = isAuthenticated 
            ? api.get(`/api/courses/${id}/enrollment-status`) 
            : Promise.resolve({ ok: false } as Response);
          const reviewsPromise = api.get(`/api/courses/${id}/reviews`);
          
          // Await all promises together
          const responses = await Promise.all([
            coursePromise,
            enrollmentPromise,
            reviewsPromise
          ]);
          
          // Now typecast each response
          const courseResponse = responses[0] as Response;
          const enrollmentResponse = responses[1] as Response;
          const reviewsResponse = responses[2] as Response;

          if (courseResponse.ok) {
            const courseData = await courseResponse.json() as ApiResponse<CourseWithDetails>;
            if (courseData.success && courseData.data) {
              setCourse(courseData.data);
            } else {
              throw new Error('Failed to fetch course details');
            }
          } else {
            throw new Error(`HTTP error! status: ${courseResponse.status}`);
          }

          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json() as { isEnrolled: boolean };
            setIsEnrolled(enrollmentData.isEnrolled || false);
          }

          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json() as ApiResponse<CourseReview[]>;
            if (reviewsData.success && reviewsData.data) {
              setReviews(reviewsData.data);
            }
          }
          
          setLastUpdated("2025-08-18 20:28:23");
        } catch (apiError) {
          console.error('API error:', apiError);
          // Fall back to mock data
          loadMockData(parseInt(id));
        }
      } catch (err) {
        setError(typeof err === 'string' ? err : 'An error occurred while loading the course');
        loadMockData(parseInt(id));
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isAuthenticated]);

  const loadMockData = (courseId: number) => {
    // Enhanced mock data
    setCourse({
      id: courseId,
      title: "القانون الدستوري المعاصر والأنظمة السياسية",
      description: "دورة شاملة ومتقدمة في القانون الدستوري تغطي جميع جوانب النظم الدستورية الحديثة والمبادئ الأساسية للدولة القانونية مع التطبيقات العملية في الأنظمة العربية والدولية",
      cover_image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=630&fit=crop",
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-08-16T14:33:18Z",
      video_count: 36,
      enrolled_count: 1247,
      syllabus: "منهج متكامل يبدأ من الأسس النظرية للقانون الدستوري وصولاً إلى التطبيقات العملية في النظم السياسية المعاصرة. يشمل دراسة الدساتير العربية والدولية، مبادئ الفصل بين السلطات، حقوق الإنسان والحريات الأساسية، النظم الانتخابية، والرقابة الدستورية. كما يتضمن تحليل القضايا المعاصرة في القانون الدستوري مثل تأثير التكنولوجيا والذكاء الاصطناعي على الحقوق الدستورية.",
      requirements: [
        "معرفة أساسية بمبادئ القانون العام والنظم القانونية",
        "القدرة على القراءة والفهم والتحليل باللغة العربية",
        "اهتمام بالشؤون القانونية والسياسية والدستورية",
        "حاسوب أو جهاز لوحي مع اتصال إنترنت مستقر",
        "استعداد لتخصيص 8-10 ساعات أسبوعياً للدراسة",
        "رغبة في المشاركة في النقاشات والتطبيقات العملية"
      ],
      learning_outcomes: [
        "إتقان المفاهيم الأساسية والمتقدمة في القانون الدستوري",
        "تحليل وتفسير النصوص الدستورية والقوانين الأساسية بشكل احترافي",
        "فهم عميق لأنواع النظم السياسية والدستورية المختلفة",
        "القدرة على تطبيق المبادئ الدستورية في الحالات العملية",
        "معرفة شاملة بآليات الفصل بين السلطات وضوابطها",
        "فهم حقوق الإنسان والحريات الأساسية من منظور دستوري",
        "تحليل القضايا الدستورية المعاصرة والحلول القانونية لها",
        "إعداد مذكرات قانونية ودستورية متخصصة"
      ],
      reviews_count: 156,
      average_rating: 4.8,
      language: "العربية",
      level: "متوسط إلى متقدم",
      price: 299,
      discount_price: 199,
      certificate_included: true,
      videos: [
        {
          id: 1,
          title: "مقدمة شاملة في القانون الدستوري",
          description: "نظرة عامة على تعريف القانون الدستوري، أهميته، مصادره، والمدارس الفكرية المختلفة في دراسته",
          duration: 2400,
          course_id: courseId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-08-16T14:33:18Z",
          url: "https://example.com/video1.mp4",
          order: 1,
          thumbnail: "https://via.placeholder.com/320x180",
          is_free: true,
          file_path: "/videos/course1/video1.mp4",
          is_active: true
        },
        {
          id: 2,
          title: "تطور الدساتير عبر التاريخ والحضارات",
          description: "دراسة تاريخية متعمقة لتطور الدساتير من العصور القديمة حتى العصر الحديث مع التركيز على الدساتير العربية",
          duration: 3600,
          course_id: courseId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-08-16T14:33:18Z",
          url: "https://example.com/video2.mp4",
          order: 2,
          thumbnail: "https://via.placeholder.com/320x180",
          is_free: true,
          file_path: "/videos/course1/video2.mp4",
          is_active: true
        },
        {
          id: 3,
          title: "مبدأ الفصل بين السلطات: النظرية والتطبيق",
          description: "شرح مفصل ومتقدم لمبدأ الفصل بين السلطات التنفيذية والتشريعية والقضائية مع الأمثلة العملية",
          duration: 3000,
          course_id: courseId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-08-16T14:33:18Z",
          url: "https://example.com/video3.mp4",
          order: 3,
          thumbnail: "https://via.placeholder.com/320x180",
          is_free: false,
          file_path: "/videos/course1/video3.mp4",
          is_active: true
        },
        {
          id: 4,
          title: "حقوق الإنسان في الدساتير المعاصرة",
          description: "دراسة شاملة لحقوق الإنسان والحريات الأساسية كما نصت عليها الدساتير الحديثة",
          duration: 2700,
          course_id: courseId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-08-16T14:33:18Z",
          url: "https://example.com/video4.mp4",
          order: 4,
          thumbnail: "https://via.placeholder.com/320x180",
          is_free: false,
          file_path: "/videos/course1/video4.mp4",
          is_active: true
        },
        {
          id: 5,
          title: "النظم الانتخابية والديمقراطية الدستورية",
          description: "تحليل مختلف النظم الانتخابية ودورها في تطبيق المبادئ الديمقراطية الدستورية",
          duration: 3300,
          course_id: courseId,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-08-16T14:33:18Z",
          url: "https://example.com/video5.mp4",
          order: 5,
          thumbnail: "https://via.placeholder.com/320x180",
          is_free: false,
          file_path: "/videos/course1/video5.mp4",
          is_active: true
        }
      ],
      instructor: {
        id: 1,
        name: "د. أحمد محمد الحقوقي",
        email: "ahmad.constitutional@university.edu",
        is_admin: false,
        is_approved: true,
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2025-08-16T14:33:18Z"
      }
    });

    setReviews([
      {
        id: 1,
        user_name: "محمد أحمد السالم",
        rating: 5,
        comment: "دورة استثنائية ومفيدة جداً. الدكتور أحمد لديه طريقة رائعة في الشرح والتوضيح. استفدت كثيراً من الأمثلة العملية والتطبيقات القانونية. أنصح بهذه الدورة بشدة لكل المهتمين بالقانون الدستوري.",
        created_at: "2025-08-15T10:30:00Z"
      },
      {
        id: 2,
        user_name: "فاطمة الزهراء المحامية",
        rating: 5,
        comment: "محتوى ممتاز وشامل يغطي جميع جوانب القانون الدستوري. المواد مرتبة بشكل منطقي والشرح واضح ومبسط. ساعدتني هذه الدورة كثيراً في فهم المفاهيم المعقدة وتطبيقها في عملي كمحامية.",
        created_at: "2025-08-12T14:45:00Z"
      },
      {
        id: 3,
        user_name: "عبدالله خالد الكريم",
        rating: 4,
        comment: "دورة جيدة جداً ومفيدة. أعجبني التنوع في المحتوى والأمثلة من دول مختلفة. ربما يمكن إضافة المزيد من التطبيقات العملية والحالات الدراسية للمزيد من الفائدة.",
        created_at: "2025-08-10T09:20:00Z"
      }
    ]);

    setIsEnrolled(false);
  };

  const handleEnrollment = async () => {
    if (!course) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setEnrollmentLoading(true);
      if (isEnrolled) {
        // Unenroll
        const response = await api.delete(`/api/courses/${course.id}/enrollment`) as Response;
        
        if (response.ok) {
          setIsEnrolled(false);
          setCourse(prev => prev ? { 
            ...prev, 
            enrolled_count: Math.max(0, prev.enrolled_count - 1) 
          } : null);
        } else {
          throw new Error('Failed to unenroll');
        }
      } else {
        // Enroll
        const response = await api.post(`/api/courses/${course.id}/enrollment`, {}) as Response;
        
        if (response.ok) {
          setIsEnrolled(true);
          setCourse(prev => prev ? { 
            ...prev, 
            enrolled_count: prev.enrolled_count + 1 
          } : null);
        } else {
          throw new Error('Failed to enroll');
        }
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      
      // For demo purposes, simulate success
      if (!isEnrolled) {
        setIsEnrolled(true);
        setCourse(prev => prev ? { 
          ...prev, 
          enrolled_count: prev.enrolled_count + 1 
        } : null);
      }
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return '0min';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  };

  const getTotalDuration = (): string => {
    if (!course?.videos) return '0min';
    const totalSeconds = course.videos.reduce((sum, v) => sum + (v.duration || 0), 0);
    return formatDuration(totalSeconds);
  };

  const renderStars = (rating: number): JSX.Element[] => {
    return [...Array(5)].map((_, i) => (
      <span 
        key={i} 
        className={`text-xl ${i < Math.floor(rating) ? 'text-yellow-400 animate-pulse' : 'text-gray-300'}`}
      >
        ⭐
      </span>
    ));
  };

  if (loading) {
    return <Loading fullScreen text="Chargement des détails du cours..." />;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="text-6xl mb-6 animate-bounce">❌</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cours introuvable</h2>
          <p className="text-gray-600 mb-8">Le cours que vous recherchez n'existe pas ou n'est plus disponible.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/courses" className="btn-cool btn-primary-cool hover-scale px-8 py-4">
              🔙 Retour aux Cours
            </Link>
            <button onClick={() => navigate(-1)} className="btn-cool glass hover-lift px-8 py-4">
              ↩️ Page Précédente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Hero Section */}
      <section className="relative py-24 bg-gradient-blue animate-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        {course.cover_image && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={course.cover_image} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            {/* Course Info */}
            <div className="lg:col-span-2 animate-slideInLeft">
              {/* Breadcrumb */}
              <div className="flex items-center mb-6 text-sm">
                <Link to="/" className="hover:text-yellow-300 transition-colors">🏠 Accueil</Link>
                <span className="mx-2">{'>'}</span>
                <Link to="/courses" className="hover:text-yellow-300 transition-colors">📚 Cours</Link>
                <span className="mx-2">{'>'}</span>
                <span className="text-yellow-300">Détails du cours</span>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center mb-6">
                <div className="flex items-center mr-4">
                  {renderStars(course.average_rating)}
                  <span className="ml-2 text-yellow-300 font-medium">
                    {course.average_rating} ({course.reviews_count} avis)
                  </span>
                </div>
                <span className="glass px-3 py-1 rounded-full text-sm font-medium arabic-text">
                  {course.level}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 arabic-text text-glow">
                {course.title}
              </h1>
              
              <p className="text-xl mb-8 arabic-text text-shadow leading-relaxed">
                {course.description}
              </p>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  { icon: '🎥', label: 'Vidéos', value: course.video_count || 0 },
                  { icon: '👥', label: 'Étudiants', value: course.enrolled_count.toLocaleString() },
                  { icon: '⏰', label: 'Durée', value: getTotalDuration() },
                  { icon: '🌐', label: 'Langue', value: course.language }
                ].map((stat, index) => (
                  <div key={index} className="text-center animate-pulse" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="font-bold text-lg">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Instructor Info */}
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 text-xl font-bold mr-4 animate-pulse">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-lg">👨‍🏫 Instructeur</div>
                  <div className="arabic-text text-yellow-300">{course.instructor.name}</div>
                  <div className="text-sm opacity-80">Expert en Droit Constitutionnel</div>
                </div>
              </div>
            </div>
            
            {/* Enrollment Card */}
            <div className="lg:col-span-1 animate-slideInRight">
              <div className="sticky top-8">
                <div className="card-cool hover-lift p-8">
                  {/* Course Preview */}
                  <div className="relative rounded-lg overflow-hidden mb-6 group">
                    <img
                      src={course.cover_image || "https://via.placeholder.com/400/250"}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn-cool glass hover-scale p-4 rounded-full animate-pulse">
                        <span className="text-3xl">▶️</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    {course.discount_price ? (
                      <div>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {course.discount_price}€
                        </div>
                        <div className="text-lg text-gray-500 line-through">
                          {course.price}€
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          🎉 Économisez {course.price && course.discount_price ? ((course.price - course.discount_price) / course.price * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-blue-600">
                        {course.price ? `${course.price}€` : 'Gratuit'}
                      </div>
                    )}
                  </div>

                  {/* Enrollment Button */}
                  <button
                    onClick={handleEnrollment}
                    disabled={enrollmentLoading}
                    className={`btn-cool w-full mb-4 py-4 text-lg hover-scale animate-glow ${
                      isEnrolled ? 'btn-success-cool' : 'btn-primary-cool'
                    } ${enrollmentLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {enrollmentLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-dots scale-50 mr-2">
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                        Traitement...
                      </div>
                    ) : isEnrolled ? (
                      '✅ Inscrit - Continuer l\'Apprentissage'
                    ) : (
                      '🚀 S\'inscrire Maintenant'
                    )}
                  </button>

                  {/* Video Access Button */}
                  {isEnrolled && (
                    <Link
                      to={`/courses/${course.id}/videos`}
                      className="btn-cool glass hover-lift w-full py-3 text-center block mb-4"
                    >
                      <span className="mr-2">🎬</span>
                      Regarder les Vidéos
                    </Link>
                  )}

                  {/* Course Features */}
                  <div className="space-y-3 text-sm">
                    {[
                      { icon: '🎓', text: 'Accès à vie' },
                      { icon: '📱', text: 'Compatible mobile' },
                      { icon: '📜', text: course.certificate_included ? 'Certificat inclus' : 'Pas de certificat' },
                      { icon: '💬', text: 'Support communautaire' },
                      { icon: '🔄', text: 'Mises à jour gratuites' }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center animate-slideInLeft" style={{animationDelay: `${index * 0.1}s`}}>
                        <span className="text-lg mr-3">{feature.icon}</span>
                        <span className="text-gray-700">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Last Updated Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                    <div>Dernière mise à jour: 2025-08-18 20:32:13</div>
                    <div className="mt-1">Par: Azizkh07</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content Tabs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8 animate-slideInLeft">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex justify-center mb-12 animate-fadeIn">
            <div className="glass p-2 rounded-lg">
              <div className="flex flex-wrap justify-center">
                {[
                  { key: 'overview', label: 'Vue d\'ensemble', icon: '📋' },
                  { key: 'content', label: 'Contenu', icon: '🎥' },
                  { key: 'reviews', label: 'Avis', icon: '⭐' },
                  { key: 'instructor', label: 'Instructeur', icon: '👨‍🏫' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all mx-1 my-1 ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white animate-pulse shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-5xl mx-auto">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Course Description */}
                <div className="card-cool hover-lift animate-slideInLeft">
                  <h3 className="text-2xl font-bold text-gradient mb-6">
                    📖 Description Détaillée du Cours
                  </h3>
                  <div className="prose prose-lg max-w-none arabic-text text-gray-700 leading-relaxed" style={{direction: 'rtl', textAlign: 'right'}}>
                    <p>{course.syllabus}</p>
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="card-cool hover-lift animate-slideInRight">
                  <h3 className="text-2xl font-bold text-gradient mb-6">
                    🎯 Ce que vous allez apprendre
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.learning_outcomes.map((outcome, index) => (
                      <div
                        key={index}
                        className="flex items-start p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg hover:shadow-md transition-all animate-slideInLeft"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <span className="text-green-500 text-xl mr-3 mt-1 animate-pulse">✅</span>
                        <span className="text-gray-700 arabic-text leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="card-cool hover-lift animate-slideInLeft">
                  <h3 className="text-2xl font-bold text-gradient mb-6">
                    📋 Prérequis et Conditions
                  </h3>
                  <div className="space-y-4">
                    {course.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-slideInRight"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <span className="text-blue-500 text-xl mr-3 mt-1 animate-pulse">📌</span>
                        <span className="text-gray-700 arabic-text leading-relaxed">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="animate-fadeIn">
                <div className="card-cool hover-lift">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gradient">
                      🎥 Contenu du Cours ({course.videos.length} vidéos)
                    </h3>
                    <div className="text-sm text-gray-600">
                      📊 Durée totale: {getTotalDuration()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {course.videos.map((video, index) => (
                      <div
                        key={video.id}
                        className="group p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg hover:shadow-md transition-all animate-slideInLeft"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex items-start gap-4">
                          {/* Video Thumbnail */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={video.thumbnail || "https://via.placeholder.com/120/80"}
                              alt={video.title}
                              className="w-24 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xl">▶️</span>
                            </div>
                            {video.is_free && (
                              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Gratuit
                              </span>
                            )}
                          </div>

                          {/* Video Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm animate-pulse">
                                  {video.order || index + 1}
                                </div>
                                <h4 className="font-bold text-gray-900 arabic-text group-hover:text-blue-600 transition-colors text-lg">
                                  {video.title}
                                </h4>
                              </div>
                              <span className="text-sm text-gray-500 flex items-center animate-pulse">
                                ⏱️ {formatDuration(video.duration)}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 arabic-text mb-3 leading-relaxed">
                              {video.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {video.is_free ? (
                                  <span className="text-green-600 text-sm font-medium flex items-center">
                                    🆓 Aperçu gratuit
                                  </span>
                                ) : (
                                  <span className="text-orange-600 text-sm font-medium flex items-center">
                                    🔒 Inscription requise
                                  </span>
                                )}
                              </div>
                              
                              {(isEnrolled || video.is_free) ? (
                                <Link 
                                  to={`/courses/${course.id}/videos`}
                                  className="btn-cool btn-primary-cool hover-scale px-4 py-2 text-sm"
                                >
                                  ▶️ Regarder
                                </Link>
                              ) : (
                                <button 
                                  onClick={handleEnrollment}
                                  className="btn-cool glass hover-lift px-4 py-2 text-sm"
                                >
                                  🔓 Débloquer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="animate-fadeIn space-y-8">
                
                {/* Reviews Summary */}
                <div className="card-cool hover-lift">
                  <h3 className="text-2xl font-bold text-gradient mb-6">
                    ⭐ Évaluations des Étudiants
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Overall Rating */}
                    <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg animate-scaleUp">
                      <div className="text-5xl font-bold text-gradient mb-3">
                        {course.average_rating}/5
                      </div>
                      <div className="flex justify-center items-center mb-3">
                        {renderStars(course.average_rating)}
                      </div>
                      <div className="text-gray-600 text-lg">
                        Basé sur {course.reviews_count} avis
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        📊 {course.enrolled_count > 0 ? Math.round((course.reviews_count / course.enrolled_count) * 100) : 0}% des étudiants ont donné leur avis
                      </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((stars, index) => {
                        const percentage = stars === 5 ? 75 : stars === 4 ? 20 : stars === 3 ? 3 : stars === 2 ? 1 : 1;
                        return (
                          <div key={stars} className="flex items-center animate-slideInRight" style={{animationDelay: `${index * 0.1}s`}}>
                            <span className="text-sm w-8">{stars}⭐</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                                style={{width: `${percentage}%`}}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-10">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div
                      key={review.id}
                      className="card-cool hover-lift animate-slideInLeft"
                      style={{animationDelay: `${index * 0.2}s`}}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-blue rounded-full flex items-center justify-center text-white font-bold text-lg animate-pulse">
                          {review.user_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-bold text-gray-900 arabic-text">{review.user_name}</h5>
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                                <span className="ml-2 text-sm text-gray-600">
                                  {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 arabic-text leading-relaxed">
                            {review.comment}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <button className="hover:text-blue-600 transition-colors">
                              👍 Utile
                            </button>
                            <button className="hover:text-blue-600 transition-colors">
                              💬 Répondre
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Tab */}
            {activeTab === 'instructor' && (
              <div className="animate-fadeIn">
                <div className="card-cool hover-lift">
                  <div className="text-center mb-8">
                    <div className="w-32 h-32 bg-gradient-blue rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 animate-pulse">
                      {course.instructor.name.charAt(0)}
                    </div>
                    <h3 className="text-3xl font-bold text-gradient mb-4 arabic-text">
                      {course.instructor.name}
                    </h3>
                    <p className="text-xl text-gray-600 mb-6">
                      Expert en Droit Constitutionnel et Sciences Politiques
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bio */}
                    <div className="animate-slideInLeft">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">📋 Biographie</h4>
                      <div className="space-y-4 text-gray-700 arabic-text leading-relaxed">
                        <p>
                          دكتور في القانون الدستوري من جامعة السوربون بباريس، وأستاذ محاضر في عدة جامعات عربية وأوروبية. له خبرة تزيد عن 20 سنة في التدريس والبحث الأكاديمي.
                        </p>
                        <p>
                          شارك في صياغة عدة دساتير عربية وقدم استشارات قانونية للعديد من المؤسسات الحكومية والدولية. نشر أكثر من 50 بحثاً ومقالاً في المجلات القانونية المحكمة.
                        </p>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="animate-slideInRight">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">🏆 Réalisations</h4>
                      <div className="space-y-4">
                        {[
                          '🎓 Doctorat en Droit Constitutionnel - Université de la Sorbonne',
                          '📚 Auteur de 15 ouvrages spécialisés en droit constitutionnel',
                          '👨‍🏫 Plus de 10,000 étudiants formés au cours de sa carrière',
                          '🏅 Prix d\'Excellence en Enseignement Juridique 2023',
                          '🌍 Consultant pour 8 pays dans la rédaction constitutionnelle',
                          '📺 Expert juridique dans les médias arabes et internationaux'
                        ].map((achievement, index) => (
                          <div
                            key={index}
                            className="flex items-start animate-slideInLeft"
                            style={{animationDelay: `${index * 0.1}s`}}
                          >
                            <span className="text-lg mr-3">{achievement.charAt(0)}</span>
                            <span className="text-gray-700">{achievement.substring(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Instructor */}
                  <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">📞 Contacter l'Instructeur</h4>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="btn-cool btn-primary-cool hover-scale px-6 py-3">
                        📧 Envoyer un Message
                      </button>
                      <button className="btn-cool glass hover-lift px-6 py-3">
                        💬 Chat en Direct
                      </button>
                      <button className="btn-cool glass hover-lift px-6 py-3">
                        📱 Prendre RDV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gradient text-center mb-12 animate-fadeIn">
            🔗 Cours Recommandés
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "قانون العمل والضمان الاجتماعي",
                description: "التشريعات الحديثة لحماية العمال",
                students: 234,
                rating: 4.6,
                price: 149
              },
              {
                title: "القانون التجاري والشركات",
                description: "أسس القانون التجاري في العصر الرقمي",
                students: 189,
                rating: 4.7,
                price: 199
              },
              {
                title: "قانون الأسرة والأحوال الشخصية",
                description: "أحكام الزواج والطلاق في الفقه الإسلامي",
                students: 345,
                rating: 4.8,
                price: 179
              }
            ].map((relatedCourse, index) => (
              <div
                key={index}
                className="card-cool hover-lift animate-slideInLeft group"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <img
                    src="https://via.placeholder.com/400/200"
                    alt={relatedCourse.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="glass px-3 py-1 text-white text-sm font-medium rounded-full">
                      ⭐ {relatedCourse.rating}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 arabic-text group-hover:text-gradient transition-all">
                    {relatedCourse.title}
                  </h3>
                  
                  <p className="text-gray-600 arabic-text line-clamp-2">
                    {relatedCourse.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="animate-pulse">👥 {relatedCourse.students} étudiants</span>
                    <span className="text-lg font-bold text-blue-600">{relatedCourse.price}€</span>
                  </div>
                  
                  <button className="btn-cool btn-primary-cool w-full hover-scale">
                    📚 Voir le Cours
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 space-y-4">
        <button 
          onClick={handleEnrollment}
          className="btn-cool btn-primary-cool hover-scale animate-float p-4 rounded-full shadow-lg"
          title="Inscription rapide"
        >
          <span className="text-2xl">🚀</span>
        </button>
        {isEnrolled && (
          <Link
            to={`/courses/${course.id}/videos`}
            className="btn-cool btn-success-cool hover-scale animate-float p-4 rounded-full shadow-lg block"
            title="Regarder les vidéos"
          >
            <span className="text-2xl">🎬</span>
          </Link>
        )}
        <Link
          to="/contact"
          className="btn-cool glass hover-lift p-4 rounded-full shadow-lg block"
          title="Contactez-nous"
        >
          <span className="text-2xl">💬</span>
        </Link>
      </div>
      
      {/* Last updated footer */}
      <div className="bg-gray-100 py-3 text-center text-xs text-gray-500">
        Dernière mise à jour: 2025-08-18 20:32:13 | Azizkh07
      </div>
    </div>
  );
};

export default CourseDetailPage;