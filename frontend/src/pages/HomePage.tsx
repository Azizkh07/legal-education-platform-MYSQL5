import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, Course } from '../lib/courses';
import { blogService, BlogPost } from '../lib/blog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import BlogCard from '../components/BlogCard';

const HomePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [coursesResponse, articlesResponse] = await Promise.all([
          courseService.getCourses(),
          blogService.getBlogPosts(),
        ]);
        
        setCourses(coursesResponse.slice(0, 3)); // Only show 3 featured courses
        setArticles(articlesResponse.slice(0, 3)); // Only show 3 featured articles
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-blue-700 text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-500 opacity-80"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Legal Education for Professionals
            </h1>
            
            <p className="text-xl mb-8">
              Access high-quality courses and resources to enhance your legal knowledge and skills.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/courses"
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-md shadow-lg transition"
              >
                Browse Courses
              </Link>
              
              <Link
                to="/blog"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700 font-semibold px-6 py-3 rounded-md transition"
              >
                Read Articles
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        </div>
      )}
      
      {/* Featured Courses */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
            <Link to="/courses" className="text-blue-600 hover:text-blue-800 font-medium">
              View all courses →
            </Link>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No courses available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div key={course.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden flex flex-col">
                  {course.cover_image && (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={course.cover_image} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    
                    <div className="text-gray-600 mb-4 line-clamp-3">
                      {course.description}
                    </div>
                  </div>
                  
                  <div className="px-6 pb-6">
                    <Link
                      to={`/courses/${course.id}`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold px-4 py-2 rounded transition"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Latest Articles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
            <Link to="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
              View all articles →
            </Link>
          </div>
          
          {articles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No articles available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <BlogCard key={article.id} blog={article} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to enhance your legal knowledge?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join our platform to access premium legal education resources, expert-led courses, and stay updated with the latest developments in law.
          </p>
          
          <Link
            to="/contact"
            className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-8 py-3 rounded-md shadow-lg transition inline-block"
          >
            Contact Us
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default HomePage;