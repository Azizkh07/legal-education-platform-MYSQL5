import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogService, BlogPost } from '../lib/blog';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Loading from '../components/Loading';

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Latest Articles</h1>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
              {error}
            </div>
          )}
          
          {blogs.length === 0 && !error ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No articles published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {blogs.map((blog) => (
                <article key={blog.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {blog.cover_image && (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={blog.cover_image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      <Link to={`/blog/${blog.slug}`} className="hover:text-blue-600 transition">
                        {blog.title}
                      </Link>
                    </h2>
                    
                    <p className="text-sm text-gray-500 mb-4">
                      {formatDate(blog.created_at)}
                    </p>
                    
                    <div className="prose prose-sm mb-4 text-gray-600">
                      {getExcerpt(blog.content, blog.excerpt)}
                    </div>
                    
                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
                    >
                      Read More
                    </Link>
                  </div>
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