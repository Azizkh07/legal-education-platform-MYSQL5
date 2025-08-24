import React, { useState, useEffect } from 'react';
import { api, getErrorMessage } from '../../lib/api';
import VideoUploadForm from './VideoUploadForm';

interface Video {
  id: number;
  title: string;
  description: string;
  video_path: string;
  thumbnail_path: string;
  duration: number;
  subject_id: number;
  file_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // From joins
  subject_title?: string;
  course_title?: string;
  professor_name?: string;
  course_id?: number;
}

interface Course {
  id: number;
  title: string;
  subject_count: number;
}

interface Subject {
  id: number;
  title: string;
  course_id: number;
  professor_name: string;
  hours: number;
  is_active: boolean;
}

const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Filters
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  console.log(`🎬 VideoManagement loaded for Azizkh07 at 2025-08-20 13:55:40`);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📊 Loading all video management data for Azizkh07...');
      
      // Load all data in parallel
      const [videosRes, coursesRes, subjectsRes] = await Promise.all([
        api.get<Video[]>('/api/videos'),
        api.get<Course[]>('/api/courses'),
        api.get<Subject[]>('/api/subjects')
      ]);
      
      console.log('✅ Data loaded successfully:', {
        videos: videosRes.length,
        courses: coursesRes.length,
        subjects: subjectsRes.length
      });
      
      setVideos(videosRes);
      setCourses(coursesRes);
      setSubjects(subjectsRes);
      
    } catch (error) {
      console.error('❌ Error loading data for Azizkh07:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newVideo: Video) => {
    console.log('✅ Video upload successful for Azizkh07, refreshing data...');
    setShowUploadForm(false);
    loadAllData(); // Reload all data to get updated relationships
  };

  const handleDeleteVideo = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting video ${id} for Azizkh07...`);
      await api.delete(`/api/videos/${id}`);
      console.log('✅ Video deleted successfully');
      loadAllData(); // Reload data
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      alert('Erreur lors de la suppression de la vidéo');
    }
  };

  // ✅ FIXED: Enhanced filtering with proper subject-course relationships
  const getFilteredVideos = () => {
    let filtered = videos;
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(search) ||
        video.description?.toLowerCase().includes(search) ||
        getVideoSubjectTitle(video).toLowerCase().includes(search) ||
        getVideoCourseTitle(video).toLowerCase().includes(search)
      );
    }
    
    // Course filter
    if (filterCourse !== 'all') {
      const courseId = parseInt(filterCourse);
      filtered = filtered.filter(video => {
        const subject = subjects.find(s => s.id === video.subject_id);
        return subject?.course_id === courseId;
      });
    }
    
    // Subject filter
    if (filterSubject !== 'all') {
      const subjectId = parseInt(filterSubject);
      filtered = filtered.filter(video => video.subject_id === subjectId);
    }
    
    return filtered;
  };

  // Helper functions to get video relationships
  const getVideoSubjectTitle = (video: Video): string => {
    const subject = subjects.find(s => s.id === video.subject_id);
    return subject?.title || 'Aucune matière';
  };

  const getVideoCourseTitle = (video: Video): string => {
    const subject = subjects.find(s => s.id === video.subject_id);
    if (!subject) return 'Aucun cours';
    const course = courses.find(c => c.id === subject.course_id);
    return course?.title || 'Aucun cours';
  };

  const getVideoProfessorName = (video: Video): string => {
    const subject = subjects.find(s => s.id === video.subject_id);
    return subject?.professor_name || 'Aucun professeur';
  };

  // Get available subjects for course filter
  const getAvailableSubjects = () => {
    if (filterCourse === 'all') {
      return subjects;
    }
    const courseId = parseInt(filterCourse);
    return subjects.filter(s => s.course_id === courseId);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = getFilteredVideos();
  const availableSubjects = getAvailableSubjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">🔄 Chargement des vidéos pour Azizkh07...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎬 Gestion des Vidéos</h1>
        
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          ➕ Ajouter une Vidéo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">Total Vidéos</h3>
          <p className="text-2xl font-bold text-blue-600">{videos.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-900">Vidéos Actives</h3>
          <p className="text-2xl font-bold text-green-600">
            {videos.filter(v => v.is_active).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900">Matières avec Vidéos</h3>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(videos.map(v => v.subject_id)).size}
          </p>
        </div>
     
      </div>

      {/* ✅ FIXED: Filter Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">🔍 Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Titre, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cours
            </label>
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setFilterSubject('all'); // Reset subject when course changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les cours</option>
              {courses.map(course => (
                <option key={course.id} value={course.id.toString()}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matière
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Toutes les matières</option>
              {availableSubjects.map(subject => (
                <option key={subject.id} value={subject.id.toString()}>
                  {subject.title}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCourse('all');
                setFilterSubject('all');
                setSearchTerm('');
              }}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              🗑️ Effacer
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          📊 {filteredVideos.length} vidéo(s) affichée(s) sur {videos.length} total
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-gray-100">
              {video.thumbnail_path ? (
                <img
                  src={`/uploads/thumbnails/${video.thumbnail_path}`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/320/180';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-4xl">🎬</span>
                </div>
              )}
              
              {/* Preview Button */}
              <button
                onClick={() => setSelectedVideo(video)}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100"
              >
                <div className="bg-white bg-opacity-90 rounded-full p-3">
                  <span className="text-2xl">▶️</span>
                </div>
              </button>
              
              {/* Duration Badge */}
              {video.duration > 0 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title}
              </h3>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>📚 {getVideoCourseTitle(video)}</p>
                <p>📖 {getVideoSubjectTitle(video)}</p>
                <p>👨‍🏫 {getVideoProfessorName(video)}</p>
                <p>📁 {formatFileSize(video.file_size || 0)}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  video.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {video.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    👁️ Voir
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️ Suppr.
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredVideos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune vidéo trouvée
          </h3>
          <p className="text-gray-600 mb-4">
            {videos.length === 0 
              ? "Aucune vidéo n'a été uploadée pour le moment."
              : "Aucune vidéo ne correspond à vos critères de recherche."
            }
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            ➕ Ajouter une Vidéo
          </button>
        </div>
      )}

      {/* Upload Form */}
      <VideoUploadForm
        isOpen={showUploadForm}
        onSuccess={handleUploadSuccess}
        onCancel={() => setShowUploadForm(false)}
      />

      {/* ✅ FIXED: Video Preview Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* ✅ FIXED: Video Player with correct path */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  controls
                  className="w-full h-full"
                  poster={selectedVideo.thumbnail_path ? `/uploads/thumbnails/${selectedVideo.thumbnail_path}` : undefined}
                  onError={(e) => {
                    console.error('❌ Video playback error for Azizkh07:', e);
                  }}
                >
                  <source 
                    src={`/uploads/videos/${selectedVideo.video_path}`} 
                    type="video/mp4" 
                  />
                  <p className="text-white p-4">
                    Votre navigateur ne supporte pas la lecture vidéo.
                    <a 
                      href={`/uploads/videos/${selectedVideo.video_path}`} 
                      className="underline ml-2"
                      download
                    >
                      Télécharger la vidéo
                    </a>
                  </p>
                </video>
              </div>
              
              {/* Video Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Description:</strong> {selectedVideo.description || 'Aucune description'}</p>
                <p><strong>Cours:</strong> {getVideoCourseTitle(selectedVideo)}</p>
                <p><strong>Matière:</strong> {getVideoSubjectTitle(selectedVideo)}</p>
                <p><strong>Professeur:</strong> {getVideoProfessorName(selectedVideo)}</p>
                <p><strong>Durée:</strong> {formatDuration(selectedVideo.duration)}</p>
                <p><strong>Taille:</strong> {formatFileSize(selectedVideo.file_size || 0)}</p>
                <p><strong>Créé le:</strong> {new Date(selectedVideo.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;