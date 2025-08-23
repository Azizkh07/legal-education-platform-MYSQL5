import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService, BlogPost } from '../lib/blog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/BlogDetailPage.css';

// Data URI placeholder image
const DEFAULT_BLOG_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyMmM1NWUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNmEzNGEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMzQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LXdlaWdodD0iNzAwIj7wn5OSKSBBY3R1YWxpdMOpcyBKdXJpZGlxdWVzPC90ZXh0Pjwvc3ZnPg==';

// Default author avatar
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMjJjNTVlIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMTZhMzRhIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSIzMCIgeT0iMzYiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSI3MDAiPkNKPC90ZXh0Pjwvc3ZnPg==';

// Simple loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="blog-loading-container">
    <div className="blog-loading-spinner"></div>
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
      <div className="blog-detail-container">
        <Header />
        <LoadingSpinner />
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-detail-container">
        <Header />
        <div className="blog-error-container">
          <div className="blog-error-card">
            <h1 className="blog-error-title">Oops! Article non trouvé</h1>
            <p className="blog-error-message">{errorMsg}</p>
            <Link to="/blog" className="blog-error-back-btn">
              ← Retour aux articles
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="blog-detail-container">
      <Header />
      
      <main className="blog-detail-main">
        {/* Hero Image Section */}
        <div className="blog-hero-image-container">
          <div className="blog-hero-image-wrapper">
            <img
              src={post.cover_image || DEFAULT_BLOG_IMAGE}
              alt={post.title}
              className="blog-hero-image"
              onError={(e: any) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_BLOG_IMAGE;
              }}
            />
            <div className="blog-hero-overlay" />
          </div>
        </div>

        {/* Content Section */}
        <div className="blog-content-card">
          <h1 className="blog-article-title">{post.title}</h1>
          
          <div className="blog-author-section">
            <div className="blog-author-avatar">
              <img
                src={DEFAULT_AVATAR}
                alt="Author"
                className="blog-author-avatar-img"
              />
            </div>
            <div className="blog-author-info">
              <div className="blog-author-name">
                {post.author_name || 'Clinique des Juristes'}
              </div>
              <div className="blog-author-date">
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>
          
          <div className="blog-article-content">
            <div className="blog-content-prose">
              {/* Split content by newlines and wrap in paragraphs */}
              {post.content.split('\n\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index}>{paragraph}</p>
                ) : null
              ))}
            </div>
          </div>
          
          <div className="blog-navigation-footer">
            <Link to="/blog" className="blog-back-link">
              ← Retour à tous les articles
            </Link>
          </div>
        </div>
      </main>
      
    
    </div>
  );
};

export default BlogDetailPage;