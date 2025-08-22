import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../lib/courses';
import { blogService } from '../lib/blog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import { resolveMediaUrl } from '../lib/media';
import '../styles/HomePage.css';

const DATA_URI_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='16'>No image</text></svg>`
)}`;

const HomePage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Put your own hero image into public/assets/graduate.png or backend uploads path
  const HERO_IMAGE_PATH = '/assets/graduate.png';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // cast to any to avoid TS narrowing to never
        const [coursesResponseRaw, articlesResponseRaw] = (await Promise.all([
          courseService.getCourses(),
          blogService.getBlogPosts()
        ])) as any[];

        // coursesResponseRaw should already be normalized by courseService
        const coursesArray: any[] = Array.isArray(coursesResponseRaw) ? coursesResponseRaw : (coursesResponseRaw?.data || coursesResponseRaw?.courses || coursesResponseRaw?.items || []);

        // robust extraction for articles (use "as any" when accessing dynamic props)
        const aResp: any = articlesResponseRaw;
        const articlesArray: any[] = Array.isArray(aResp)
          ? aResp
          : (aResp && (aResp.posts || aResp.data || aResp.items || aResp.results)) || [];

        // helpful debug info if thumbnails are missing
        if (coursesArray && coursesArray.length > 0) {
          console.debug('HomePage: first course sample:', coursesArray[0]);
        } else {
          console.debug('HomePage: coursesResponseRaw (no items):', coursesResponseRaw);
        }

        setCourses((coursesArray || []).slice(0, 6));
        setArticles((articlesArray || []).slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
        setError('Failed to load content. Please try again later.');
        setCourses([]);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Trigger animations
    setTimeout(() => setIsVisible(true), 300);

    // Mouse tracking for parallax effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (loading) return <Loading />;

  // Helper to normalize path before calling resolveMediaUrl:
  const buildImgSrc = (rawPath: any, placeholder = '/api/placeholder/400/200') => {
    if (!rawPath) return resolveMediaUrl(undefined, placeholder);

    if (typeof rawPath !== 'string') {
      return resolveMediaUrl(undefined, placeholder);
    }

    // If absolute URL, use as is
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      return rawPath;
    }

    // Ensure leading slash for relative paths so resolveMediaUrl can prefix API base
    const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return resolveMediaUrl(normalized, placeholder);
  };

  return (
    <div className="homepage-container">
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid" />

        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`particle particle-${i % 5}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="hero-bg-shapes">
          <div
            className="bg-shape shape-1"
            style={{
              transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px) rotate(${mousePosition.x * 5}deg)`
            }}
          />
          <div
            className="bg-shape shape-2"
            style={{
              transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px) rotate(${mousePosition.y * -3}deg)`
            }}
          />
          <div
            className="bg-shape shape-3"
            style={{
              transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 25}px)`
            }}
          />
        </div>

        <div className="hero-content">
          <div className="container">
            <div className="hero-layout">
              <div className={`hero-text ${isVisible ? 'animate-in' : ''}`}>
                <div className="hero-badge">
                  <span className="badge-icon">⚖️</span>
                  <span className="badge-text">L'éducation Juridique Premium</span>
                  <div className="badge-glow" />
                </div>

                <h1 className="hero-title">
                  <span className="title-line">L'éducation</span>
                  <span className="title-highlight">Juridique</span>
                  <span className="title-line">Moderne,</span>
                  <span className="title-accent">À Portée De Main</span>
                </h1>

                <p className="hero-description">
                  Clinique des juristes - Toutes les disciplines juridiques. Formations expertes modernes, pour réussir.
                </p>

                <div className="hero-actions">
                  <Link to="/courses" className="cta-primary">
                    <span className="btn-bg" />
                    <span className="btn-text">En savoir plus</span>
                    <div className="btn-shine" />
                  </Link>

                  <Link to="/contact" className="cta-secondary">
                    <span className="btn-text">Nous contacter</span>
                    <div className="btn-border-animation" />
                  </Link>
                </div>
              </div>

              {/* Right visual: use your image (place in public/assets or backend uploads) */}
              <div className={`hero-visual ${isVisible ? 'animate-in' : ''}`}>
                <div className="visual-container">
                  <div className="graduate-circle">
                    <div className="graduate-image">
                      <div className="graduate-glow" />
                      <img
                        src={buildImgSrc('/assets/graduate.png', '/api/placeholder/240/240')}
                        alt="Graduate"
                        className="graduate-custom-image"
                        onError={(e: any) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DATA_URI_PLACEHOLDER;
                        }}
                        style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: '9999px' }}
                      />

                      <div className="floating-elements">
                        <div className="float-element element-1">📚</div>
                        <div className="float-element element-2">⚖️</div>
                        <div className="float-element element-3">🎓</div>
                        <div className="float-element element-4">📖</div>
                        <div className="float-element element-5">✨</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="why-choose-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Pourquoi choisir Clinique des juristes</h2>
            <p className="section-subtitle">
              VOJO is une plateforme online software suite that combines all the tools needed to run a successful school or office.
            </p>
          </div>

          <div className="features-grid">
            <div className={`feature-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">
                <div className="icon-bg blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>
              <h3 className="feature-title">Contenu structuré et clair</h3>
              <p className="feature-description">Des modules pédagogiques organisés par des experts du droit</p>
              <div className="feature-glow" />
            </div>

            <div className={`feature-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">
                <div className="icon-bg green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-4" />
                    <polyline points="9,11 12,14 15,11" />
                    <line x1="12" y1="2" x2="12" y2="14" />
                  </svg>
                </div>
              </div>
              <h3 className="feature-title">Apprenez à votre rythme</h3>
              <p className="feature-description">Accès illimité, cours disponibles 24h/24, 7j/7 on the App</p>
              <div className="feature-glow" />
            </div>

            <div className={`feature-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon">
                <div className="icon-bg purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              <h3 className="feature-title">Objectif concours & réussite</h3>
              <p className="feature-description">Préparation intensive pour les épreuves écrites CRFPA et orales</p>
              <div className="feature-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nos cours</h2>
            <p className="section-subtitle">
              Améliorer significativement vos formations les plus efficaces, mises à jour par nos enseignants.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">📚</div>
              <p>Nos cours arrivent bientôt!</p>
            </div>
          ) : (
            <>
              <div className="courses-grid">
                {courses.map((course, index) => {
                  // prefer a thumb if available, else thumbnail_path or cover_image
                  const imgField = course.cover_image_thumb || course.thumbnail_path || course.cover_image || undefined;
                  const imgSrc = buildImgSrc(imgField, '/api/placeholder/400/200');

                  return (
                    <div
                      key={course.id ?? index}
                      className={`course-card ${isVisible ? 'animate-in' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="course-image-container">
                        <img
                          src={imgSrc}
                          alt={course.title || 'Course'}
                          className="course-image"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DATA_URI_PLACEHOLDER;
                          }}
                          loading="lazy"
                        />

                        <div className="course-overlay">
                          <Link to={`/courses/${course.id}`} className="course-link">
                            <span>Voir le cours</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                          </Link>
                        </div>
                        <div className="course-badge">Nouveau</div>
                      </div>

                      <div className="course-content">
                        <h3 className="course-title">{course.title || 'Untitled Course'}</h3>
                        <p className="course-description">
                          {course.description || 'Description will be available soon.'}
                        </p>
                      
                      </div>

                      <div className="card-glow" />
                    </div>
                  );
                })}
              </div>

              <div className="section-footer">
                <Link to="/courses" className="view-all-btn">
                  <span>Voir Tous</span>
                  <div className="btn-arrow">→</div>
                  <div className="btn-ripple" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Articles Section (unchanged) */}
      <section className="articles-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Derniers articles</h2>
            <p className="section-subtitle">Découvrez nos conseils, actualités juridiques et ressources pédagogiques.</p>
          </div>

          {articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-animation">✍️</div>
              <p>Nos articles arrivent bientôt!</p>
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {articles.map((article, index) => {
                  const imgSrc = buildImgSrc(article.cover_image_thumb || article.cover_image || undefined, '/api/placeholder/480/240');
                  return (
                    <div
                      key={article.id ?? index}
                      className={`article-card ${isVisible ? 'animate-in' : ''}`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="article-image-container">
                        <img
                          src={imgSrc}
                          alt={article.title}
                          className="article-image"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DATA_URI_PLACEHOLDER;
                          }}
                          loading="lazy"
                        />
                        <div className="article-overlay" />
                      </div>

                      <div className="article-content">
                        <div className="article-meta">
                          <span className="article-date">{article.created_at ? new Date(article.created_at).toLocaleDateString() : '—'}</span>
                        </div>
                        <h3 className="article-title">{article.title || 'Untitled Article'}</h3>
                        <p className="article-excerpt">{article.excerpt || 'Article excerpt will appear here.'}</p>
                      </div>

                      <div className="card-hover-effect" />
                    </div>
                  );
                })}
              </div>

              <div className="section-footer">
                <Link to="/blog" className="view-all-btn">
                  <span>Voir Tous</span>
                  <div className="btn-arrow">→</div>
                  <div className="btn-ripple" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;