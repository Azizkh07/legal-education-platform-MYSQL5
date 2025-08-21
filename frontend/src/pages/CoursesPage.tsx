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
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCoursesData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyEnrollments();
    } else {
      setEnrolledCourseIds(new Set());
    }
  }, [isAuthenticated]);

  const fetchMyEnrollments = async () => {
    try {
      const res: any = await api.get('/user-courses/me');
      if (res && res.success) {
        const ids: number[] = res.courseIds || (res.courses || []).map((c: any) => c.id) || [];
        setEnrolledCourseIds(new Set(ids));
      } else if (Array.isArray(res)) {
        const ids = res.map((c: any) => c.id);
        setEnrolledCourseIds(new Set(ids));
      }
    } catch (err) {
      console.warn('Could not fetch enrollments:', err);
    }
  };

  const loadCoursesData = async () => {
    try {
      setLoading(true);
      setError('');

      const [coursesRes, subjectsRes, videosRes] = await Promise.all([
        api.get<Course[]>('/courses'),
        api.get<Subject[]>('/subjects'),
        videoService.getAllVideosWithSubjects()
      ]);

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
          const professorsSet: { [key: string]: boolean } = {};
          subjectsWithVideos.forEach(s => { professorsSet[s.professor_name] = true; });
          const professors = Object.keys(professorsSet);

          return {
            ...course,
            subjects: subjectsWithVideos,
            totalVideos,
            totalHours,
            professors
          };
        })
        .filter(course => course.totalVideos > 0);

      setCourses(coursesWithData);
    } catch (error) {
      console.error('❌ Error loading courses:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    // video.course_id may be undefined; guard it
    const courseId = typeof video.course_id === 'number' ? video.course_id : undefined;
    const isEnrolled = typeof courseId === 'number' ? enrolledCourseIds.has(courseId) : false;

    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/courses?video=${video.id}`, message: 'Connectez-vous pour regarder la vidéo complète' }});
      return;
    }

    if (!isEnrolled) {
      alert('Vous n\'êtes pas inscrit à ce cours. Contactez l\'administrateur pour demander un accès.');
      return;
    }

    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };
  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  const getCategoriesArray = (): string[] => {
    const categoriesSet: { [key: string]: boolean } = { all: true };
    courses.forEach(c => {
      if (c.category) categoriesSet[c.category] = true;
    });
    return Object.keys(categoriesSet);
  };

  const categories = getCategoriesArray();
  const filteredCourses = selectedCategory === 'all' ? courses : courses.filter(c => c.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">🔄 Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / hero etc (same as your existing UI) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">...</div>
        ) : (
          <div className="space-y-12">
            {filteredCourses.map(course => {
              const isCourseEnrolled = enrolledCourseIds.has(course.id);
              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* ... header/content preserved */}
                  <div className="p-8">
                    <div className="space-y-8">
                      {course.subjects.map((subject, subjectIndex) => (
                        <div key={subject.id}>
                          {/* subject header */}
                          {subject.videos.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {subject.videos.map((video, videoIndex) => (
                                <div key={video.id} className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                                  <div className="aspect-video">
                                    <VideoPreview
                                      video={video}
                                      maxDuration={10}
                                      showPlayButton={true}
                                      className="w-full h-full"
                                      onPreviewClick={() => {
                                        // allow preview even if not enrolled (10s preview)
                                        if (!isAuthenticated) {
                                          navigate('/login', { state: { returnTo: `/courses?video=${video.id}` }});
                                          return;
                                        }
                                        if (!isCourseEnrolled) {
                                          alert('Vous n\'êtes pas inscrit à ce cours. Contactez l\'administrateur pour demander un accès.');
                                          return;
                                        }
                                        handleVideoClick(video);
                                      }}
                                    />
                                  </div>

                                  <div className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">{video.title}</h4>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{video.duration ? videoService.formatDuration(video.duration) : '0:00'}</span>
                                      <span>{video.file_size ? videoService.formatFileSize(video.file_size) : 'N/A'}</span>
                                    </div>

                                    <button
                                      onClick={() => {
                                        if (!isAuthenticated) {
                                          navigate('/login', { state: { returnTo: `/courses?video=${video.id}` }});
                                          return;
                                        }
                                        if (!isCourseEnrolled) {
                                          alert('Vous n\'êtes pas inscrit à ce cours. Contactez l\'administrateur pour demander un accès.');
                                          return;
                                        }
                                        handleVideoClick(video);
                                      }}
                                      className={`w-full mt-3 ${isCourseEnrolled ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-200 text-gray-700 cursor-not-allowed'} py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
                                      disabled={!isCourseEnrolled}
                                    >
                                      {isCourseEnrolled ? '▶️ Regarder' : '🔒 Inscription requise'}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="w-full h-full">
            <ProfessionalVideoPlayer video={selectedVideo} isAuthenticated={isAuthenticated} onClose={closeVideoPlayer} className="w-full h-full" autoPlay={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
