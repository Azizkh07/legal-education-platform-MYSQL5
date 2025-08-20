import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { videoService, Video } from '../lib/videoService';
import VideoPreview from '../components/VideoPreview';
import ProfessionalVideoPlayer from '../components/ProfessionalVideoPlayer';
import { useAuth } from '../lib/AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  is_active: boolean;
}

interface Subject {
  id: number;
  title: string;
  description: string;
  professor_name: string;
  hours: number;
  course_id: number;
  is_active: boolean;
}

interface CourseWithData extends Course {
  subjects: (Subject & { videos: Video[] })[];
  totalVideos: number;
  totalHours: number;
  professors: string[];
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log(`📚 Enhanced CoursesPage initialized for Azizkh07 at 2025-08-20 14:30:38`);

  useEffect(() => {
    loadCoursesData();
  }, []);

  const loadCoursesData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log(`📊 Loading courses data for Azizkh07 at 2025-08-20 14:30:38...`);

      // Load all data in parallel
      const [coursesRes, subjectsRes, videosRes] = await Promise.all([
        api.get<Course[]>('/api/courses'),
        api.get<Subject[]>('/api/subjects'),
        videoService.getAllVideosWithSubjects()
      ]);

      // Build course data with subjects and videos
      const coursesWithData: CourseWithData[] = coursesRes
        .filter(course => course.is_active)
        .map(course => {
          const courseSubjects = subjectsRes.filter(s => s.course_id === course.id && s.is_active);
          const subjectsWithVideos = courseSubjects.map(subject => ({
            ...subject,
            videos: videosRes.filter(v => v.subject_id === subject.id)
          }));

          const totalVideos = subjectsWithVideos.reduce((sum, s) => sum + s.videos.length, 0);
          const totalHours = subjectsWithVideos.reduce((sum, s) => sum + s.hours, 0);
          
          // ✅ FIXED: ES5 compatible unique professors array
          const professorsSet: { [key: string]: boolean } = {};
          subjectsWithVideos.forEach(s => {
            professorsSet[s.professor_name] = true;
          });
          const professors = Object.keys(professorsSet);

          return {
            ...course,
            subjects: subjectsWithVideos,
            totalVideos,
            totalHours,
            professors
          };
        })
        .filter(course => course.totalVideos > 0); // Only show courses with videos

      setCourses(coursesWithData);
      console.log(`✅ Loaded ${coursesWithData.length} courses with videos for Azizkh07`);

    } catch (error) {
      console.error(`❌ Error loading courses for Azizkh07:`, error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    if (!isAuthenticated) {
      console.log(`🔒 Login required for video ${video.id} - Azizkh07 at 2025-08-20 14:30:38`);
      navigate('/login', { 
        state: { 
          returnTo: `/courses?video=${video.id}`,
          message: 'Connectez-vous pour regarder la vidéo complète'
        }
      });
      return;
    }

    console.log(`▶️ Opening video player for ${video.id} - Azizkh07 at 2025-08-20 14:30:38`);
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const closeVideoPlayer = () => {
    console.log(`❌ Closing video player - Azizkh07 at 2025-08-20 14:30:38`);
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  // ✅ FIXED: ES5 compatible unique categories array
  const getCategoriesArray = (): string[] => {
    const categoriesSet: { [key: string]: boolean } = { all: true };
    courses.forEach(c => {
      if (c.category) {
        categoriesSet[c.category] = true;
      }
    });
    return Object.keys(categoriesSet);
  };
  
  const categories = getCategoriesArray();
  
  // Filter courses by category
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">🔄 Chargement des cours pour Azizkh07...</p>
          <p className="text-sm text-gray-500 mt-1">2025-08-20 14:30:38</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="font-semibold">Erreur de chargement</h3>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={loadCoursesData}
                  className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">📚 Cours Juridiques</h1>
            <p className="text-xl text-purple-100 mb-2">
              Formations professionnelles en droit avec vidéos HD
            </p>
            <p className="text-purple-200 text-sm">
              Utilisateur: Azizkh07 | Session: 2025-08-20 14:30:38
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold">{courses.length}</div>
                <div className="text-purple-100">Cours disponibles</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c.totalVideos, 0)}
                </div>
                <div className="text-purple-100">Vidéos HD</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c.subjects.length, 0)}
                </div>
                <div className="text-purple-100">Matières</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold">
                  {courses.reduce((sum, c) => sum + c.totalHours, 0)}h
                </div>
                <div className="text-purple-100">de contenu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Tous les cours' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun cours disponible
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? "Aucun cours n'est actuellement disponible."
                : `Aucun cours trouvé dans la catégorie "${selectedCategory}".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Course Header */}
                <div className="relative">
                  <div className="h-64 bg-gradient-to-r from-purple-600 to-blue-600">
                    {course.cover_image && (
                      <img
                        src={course.cover_image}
                        alt={course.title}
                        className="w-full h-full object-cover mix-blend-overlay"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                      {course.category}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{course.title}</h2>
                    <p className="text-lg text-gray-200 max-w-2xl mb-4">{course.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        {course.subjects.length} matière(s)
                      </span>
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        {course.totalVideos} vidéo(s)
                      </span>
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {course.totalHours}h de contenu
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="p-8">
                  <div className="space-y-8">
                    {course.subjects.map((subject, subjectIndex) => (
                      <div key={subject.id}>
                        {/* Subject Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                Matière {subjectIndex + 1}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {subject.hours}h • {subject.videos.length} vidéo(s)
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {subject.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{subject.description}</p>
                            <p className="text-sm text-gray-500">
                              👨‍🏫 Prof. {subject.professor_name}
                            </p>
                          </div>
                        </div>

                        {/* Videos Grid */}
                        {subject.videos.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {subject.videos.map((video, videoIndex) => (
                              <div
                                key={video.id}
                                className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                              >
                                <div className="aspect-video">
                                  <VideoPreview
                                    video={video}
                                    maxDuration={10}
                                    showPlayButton={true}
                                    className="w-full h-full"
                                    onPreviewClick={() => handleVideoClick(video)}
                                  />
                                </div>
                                
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Vidéo {videoIndex + 1}
                                    </span>
                                    {!isAuthenticated && (
                                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                        🔒 Login requis
                                      </span>
                                    )}
                                  </div>
                                  
                                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                    {video.title}
                                  </h4>
                                  
                                  {video.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                      {video.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                      {video.duration 
                                        ? videoService.formatDuration(video.duration)
                                        : '0:00'
                                      }
                                    </span>
                                    <span>
                                      {video.file_size 
                                        ? videoService.formatFileSize(video.file_size)
                                        : 'N/A'
                                      }
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleVideoClick(video)}
                                    className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    {isAuthenticated ? '▶️ Regarder' : '👁️ Aperçu 10s'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="w-full h-full">
            <ProfessionalVideoPlayer
              video={selectedVideo}
              isAuthenticated={isAuthenticated}
              onClose={closeVideoPlayer}
              className="w-full h-full"
              autoPlay={true}
            />
          </div>
          
          {/* Video Info Overlay */}
          <div className="absolute top-20 left-6 bg-black bg-opacity-75 text-white rounded-lg p-4 max-w-md">
            <h3 className="font-bold text-lg mb-2">{selectedVideo.title}</h3>
            <div className="text-sm space-y-1">
              <p>📚 {selectedVideo.course_title}</p>
              <p>📖 {selectedVideo.subject_title}</p>
              <p>👨‍🏫 {selectedVideo.professor_name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;