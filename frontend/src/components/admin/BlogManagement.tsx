import React, { useState, useEffect } from 'react';
import api, { apiUtils } from '../../lib/api'; // adjust path if your api instance lives elsewhere

interface BlogPost {
  id: number;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  published: boolean;
  author_id?: number;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_authors: number;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogManagement: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    published: false,
    cover_image: null as File | null
  });

  useEffect(() => {
    // If token expired or missing, fetch calls will throw; handle there.
    fetchPosts();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchTerm]);

  const handleAuthError = (err: any) => {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes('token expired') || msg.toLowerCase().includes('access token required')) {
      alert('Votre session a expiré. Veuillez vous reconnecter.');
      api.clearAuthData();
      // reload to show login screen (or redirect to /login)
      window.location.reload();
      return true;
    }
    return false;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filter !== 'all') {
        params.append('published', filter === 'published' ? 'true' : 'false');
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      console.log('🔍 Fetching posts...');
      const data = await api.get<{ success: boolean; posts?: BlogPost[]; error?: any }>(`/blog?${params.toString()}`);

      // The API client returns parsed JSON. Adjust to your API shape.
      if (data && (data as any).success) {
        setPosts((data as any).posts || []);
      } else {
        console.error('❌ API returned error when fetching posts:', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      if (handleAuthError(error)) return;
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching stats...');
      // admin stats endpoint
      const data = await api.get<{ success: boolean; stats?: BlogStats; error?: any }>(`/blog/admin/stats`);

      if (data && (data as any).success) {
        setStats((data as any).stats || {
          total_posts: 0,
          published_posts: 0,
          draft_posts: 0,
          total_authors: 0
        });
      } else {
        console.error('❌ Stats API returned error:', data);
        setStats({
          total_posts: 0,
          published_posts: 0,
          draft_posts: 0,
          total_authors: 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      if (handleAuthError(error)) return;
      setStats({
        total_posts: 0,
        published_posts: 0,
        draft_posts: 0,
        total_authors: 0
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('💾 BlogManagement: Submitting form data:', formData);

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('content', formData.content);
      payload.append('excerpt', formData.excerpt);
      payload.append('published', String(formData.published));

      if (formData.cover_image) {
        payload.append('cover_image', formData.cover_image);
      }

      const endpoint = selectedPost ? `/blog/${selectedPost.id}` : '/blog';
      console.log(`🚀 BlogManagement: ${selectedPost ? 'PUT' : 'POST'} request to: ${endpoint}`);

      // api.post/put will attach auth header and handle FormData correctly
      const result = selectedPost
        ? await api.put<{ success: boolean; post?: BlogPost; error?: any }>(endpoint, payload)
        : await api.post<{ success: boolean; post?: BlogPost; error?: any }>(endpoint, payload);

      // result is parsed JSON (api client returns parsed body)
      if (result && (result as any).success) {
        alert(`✅ Article ${selectedPost ? 'modifié' : 'créé'} avec succès!`);
        setShowEditor(false);
        setSelectedPost(null);
        resetForm();
        fetchPosts();
        fetchStats();
      } else {
        console.error('❌ BlogManagement: API error when saving post:', result);
        if ((result as any)?.error) alert(`❌ Erreur: ${(result as any).error}`);
        else alert('❌ Erreur lors de la sauvegarde.');
      }
    } catch (error) {
      console.error('❌ BlogManagement: Error saving post:', error);
      if (handleAuthError(error)) return;
      alert('❌ Erreur lors de la sauvegarde. Vérifiez que le backend est en marche.');
    }
  };

  const handleDeleteRequest = (post: BlogPost) => {
    setConfirmModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmModal.postId) return;

    try {
      const result = await api.delete<{ success: boolean; error?: any }>(`/blog/${confirmModal.postId}`);

      if (result && (result as any).success) {
        alert('✅ Article supprimé avec succès!');
        fetchPosts();
        fetchStats();
      } else {
        console.error('❌ Delete error:', result);
        alert(`❌ Erreur: ${(result as any)?.error || 'Impossible de supprimer l\'article'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      if (handleAuthError(error)) return;
      alert('❌ Erreur lors de la suppression');
    } finally {
      setConfirmModal({ isOpen: false, postId: null, postTitle: '' });
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModal({ isOpen: false, postId: null, postTitle: '' });
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      published: post.published,
      cover_image: null
    });
    setShowEditor(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      published: false,
      cover_image: null
    });
  };

  const handleNewPost = () => {
    setSelectedPost(null);
    resetForm();
    setShowEditor(true);
  };

  // New checkAuthStatus uses the same auth key as the client (authToken)
  const checkAuthStatus = () => {
    const token = apiUtils.getAuthToken();
    console.log('🔍 Auth check - Token exists:', !!token);
    return !!token;
  };

  // Test backend connection (uses api and respects auth)
  const testConnection = async () => {
    try {
      console.log('🔗 BlogManagement: Testing backend connection...');
      console.log('🔍 Auth status:', checkAuthStatus());

      const data = await api.get<{ success: boolean; posts?: BlogPost[] }>(`/blog`);
      // api.get returns parsed JSON; inspect it
      if (data && (data as any).success) {
        alert(`✅ Backend connection OK! Found ${(data as any).posts?.length || 0} posts.`);
      } else {
        alert('❌ Backend responded but returned an error or unexpected format.');
      }
    } catch (error) {
      console.error('❌ BlogManagement: Connection test failed:', error);
      if (handleAuthError(error)) return;
      alert('❌ Cannot connect to backend. Make sure it\'s running on http://localhost:5000');
    }
  };

  // Helper to show cover image URL fallback (protect against relative paths)
  const coverImageSrc = (cover?: string) => {
    if (!cover) return '';
    // If backend serves /uploads/... then keep full path; if stored as relative, ensure prefix
    if (cover.startsWith('http') || cover.startsWith('/')) return cover;
    return `/uploads/${cover}`;
  };

  if (showEditor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              📝 {selectedPost ? "Modifier l'article" : 'Nouvel article'}
            </h2>
            <p className="text-gray-600">{selectedPost ? "Modifiez l'article" : 'Créez un nouvel article de blog'}</p>
          </div>
          <div className="flex space-x-2">
         
            <button
              onClick={() => { setShowEditor(false); setSelectedPost(null); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              ← Retour
            </button>
          </div>
        </div>

        {/* Editor Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Titre de l'article *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Entrez le titre de l'article..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Résumé (optionnel)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Résumé court de l'article..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu de l'article *</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm"
                placeholder="Écrivez le contenu de votre article en Markdown ou HTML..."
              />
              <p className="text-xs text-gray-500 mt-1">💡 Vous pouvez utiliser du HTML ou Markdown pour le formatage</p>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image de couverture</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.files?.[0] || null })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {selectedPost?.cover_image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Image actuelle:</p>
                  <img
                    src={coverImageSrc(selectedPost.cover_image)}
                    alt="Current cover"
                    className="mt-1 h-20 w-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Published Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">Publier l'article immédiatement</label>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
              >
                {selectedPost ? "💾 Modifier l'article" : "✨ Créer l'article"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer l'article "${confirmModal.postTitle}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📝 Gestion des Articles</h2>
          <p className="text-gray-600">Gérez tous les articles de votre blog</p>
        </div>
        <div className="flex space-x-2">
      
          <button
            onClick={handleNewPost}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
          >
            ➕ Nouvel Article
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Articles</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_posts}</p>
              </div>
              <span className="text-3xl">📝</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Publiés</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.published_posts}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Brouillons</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.draft_posts}</p>
              </div>
              <span className="text-3xl">📄</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Auteurs</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_authors}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex space-x-2">
            {(['all', 'published', 'draft'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption === 'all' ? 'Tous' :
                 filterOption === 'published' ? 'Publiés' : 'Brouillons'}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Aucun article trouvé. Cliquez sur "Test Backend" pour vérifier la connexion.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start space-x-4">
                  {/* Cover Image */}
                  {post.cover_image ? (
                    <img
                      src={coverImageSrc(post.cover_image)}
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{post.title}</h3>
                        {post.excerpt && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>👤 {post.author_name || '—'}</span>
                          <span>📅 {post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.published ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {post.published ? '✅ Publié' : '📄 Brouillon'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(post)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;