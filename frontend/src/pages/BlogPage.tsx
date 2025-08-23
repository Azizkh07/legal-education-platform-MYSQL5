import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogService, BlogPost } from '../lib/blog';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Loading from '../components/Loading';
import '../styles/BlogPage.css';

const DEFAULT_BLOG_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyMmM1NWUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxNmEzNGEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMzQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LXdlaWdodD0iNzAwIj7wn5OSKSBBY3R1YWxpdMOpcyBKdXJpZGlxdWVzPC90ZXh0Pjwvc3ZnPg==';

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const fetchedBlogs = await blogService.getBlogPosts();
        setBlogs(fetchedBlogs);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
        setError("Failed to load blog posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();

    // Trigger animations
    setTimeout(() => setIsVisible(true), 300);
  }, []);

  // Function to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to create excerpt if none exists
  const getExcerpt = (content: string, excerpt?: string) => {
    if (excerpt) return excerpt;
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  };

  if (loading) return <Loading />;

  return (
    <div className="blog-page-container">
      <Header />
      
      {/* Hero Section */}
      <section className="blog-hero-section">
        <div className="blog-hero-grid" />
        
        <div className="blog-particles-container">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="blog-particle" />
          ))}
        </div>

        <div className="blog-hero-content">
          <div className="blog-hero-badge">
            <span className="blog-badge-icon">✍️</span>
            <span className="blog-badge-text">Actualités & Conseils Juridiques</span>
            <div className="blog-badge-glow" />
          </div>

          <h1 className="blog-hero-title">
            Derniers <span className="blog-title-highlight">Articles</span>
          </h1>

          <p className="blog-hero-description">
            Découvrez nos conseils d'experts, actualités juridiques et ressources pédagogiques pour rester informé des dernières évolutions du droit.
          </p>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="blog-main-content">
        <div className="blog-container">
          {error && (
            <div className="blog-error-card">
              <p className="blog-error-text">{error}</p>
            </div>
          )}
          
          {blogs.length === 0 && !error ? (
            <div className="blog-empty-state">
              <div className="blog-empty-animation">📝</div>
              <p className="blog-empty-text">Nos articles arrivent bientôt! Revenez prochainement pour découvrir nos contenus juridiques.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {blogs.map((blog, index) => (
                <article 
                  key={blog.id} 
                  className={`blog-card ${isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="blog-image-container">
                    <img 
                      src={blog.cover_image || DEFAULT_BLOG_IMAGE} 
                      alt={blog.title} 
                      className="blog-image"
                      onError={(e: any) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_BLOG_IMAGE;
                      }}
                      loading="lazy"
                    />
                    <div className="blog-image-overlay" />
                  </div>
                  
                  <div className="blog-content">
                    <h2 className="blog-title">
                      <Link to={`/blog/${blog.slug}`} className="blog-title-link">
                        {blog.title}
                      </Link>
                    </h2>
                    
                    <div className="blog-date">
                      {formatDate(blog.created_at)}
                    </div>
                    
                    <div className="blog-excerpt">
                      {getExcerpt(blog.content, blog.excerpt)}
                    </div>
                    
                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="blog-read-more"
                    >
                      <span>Lire la suite</span>
                      <span className="blog-read-more-icon">→</span>
                    </Link>
                  </div>

                  <div className="blog-card-glow" />
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      
    
    </div>
  );
};

export default BlogPage;