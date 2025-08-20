import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService, BlogPost } from '../lib/blog';

// Data URI placeholder image instead of placeholder.com
const DEFAULT_BLOG_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzAwNjZjYyIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIj5CbG9nIFBvc3Q8L3RleHQ+PC9zdmc+';

// Default author avatar
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiMwNkI2RDQiLz48dGV4dCB4PSI0MCIgeT0iNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiPkxFPC90ZXh0Pjwvc3ZnPg==';

// Simple loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('Blog post not found');

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        setError(false);
        
        if (!slug) {
          setError(true);
          setErrorMsg('Invalid blog URL');
          return;
        }

        console.log(`🔍 Fetching blog post with slug: ${slug}`);
        
        // Try to get by ID first if the slug is a number
        let foundPost: BlogPost | null = null;
        const slugAsNumber = parseInt(slug);
        
        if (!isNaN(slugAsNumber)) {
          // This is a numeric ID, try to fetch all posts and find by ID
          const allPosts = await blogService.getBlogPosts();
          const matchingPost = allPosts.find(p => p.id === slugAsNumber);
          if (matchingPost) {
            foundPost = matchingPost;
          }
        } else {
          // This is a slug, use the normal endpoint
          foundPost = await blogService.getBlogBySlug(slug);
        }

        if (foundPost) {
          console.log('✅ Blog post found:', foundPost);
          setPost(foundPost);
          setError(false);
        } else {
          console.error('❌ Blog post not found for slug:', slug);
          setError(true);
          setErrorMsg('Blog post not found');
        }
      } catch (err: any) {
        console.error('❌ Error fetching blog post:', err);
        setError(true);
        
        // Check if it's a specific HTTP error
        if (err.message?.includes('500')) {
          setErrorMsg('Server error: The blog post could not be loaded. Please try again later.');
        } else {
          setErrorMsg('Failed to load blog post: ' + (err.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug]);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{errorMsg}</p>
          <Link
            to="/blog"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition"
          >
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero section with image */}
      <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
        <div className="relative h-64 md:h-96 bg-gray-200">
          <img
            src={post.cover_image || DEFAULT_BLOG_IMAGE}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_BLOG_IMAGE;
            }}
          />
        </div>
      </div>

      {/* Content section */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
            <img
              src={DEFAULT_AVATAR}
              alt="Author"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {post.author_name || 'Clinique Juriste'}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(post.created_at)}
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none prose-lg prose-blue">
          {/* Split content by newlines and wrap in paragraphs */}
          {post.content.split('\n\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index}>{paragraph}</p>
            ) : null
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/blog"
            className="inline-block text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;