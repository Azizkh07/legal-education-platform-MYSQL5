import { api } from './api';

// Course interface matching backend
export interface Course {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  category?: string;
  thumbnail_path?: string; 
  is_active: boolean;
  created_at: string;
  updated_at: string;
  video_count?: number; // From aggregation
  subject_count?: number;

  videos?: Video[];
  // level is intentionally removed as requested
}

// Video interface matching backend
export interface Video {
  id: number;
  title: string;
  course_id: number;
  file_path: string;
  file_size?: number;
  duration?: number;
  mime_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API response wrapper interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Course service
export const courseService = {
  // Get all courses
  async getCourses(): Promise<Course[]> {
    try {
      // Change the type annotation to include the wrapper
      const response = await api.get<ApiResponse<Course[]>>('/courses');
      
      // Check if we got a successful response with data
      if (response && response.success && response.data) {
        return response.data;
      }
      
      // If API returns successful response but no data, return empty array
      if (response && response.success) {
        return [];
      }
      
      console.warn('API returned unsuccessful response:', response.message);
      return [];
    } catch (error) {
      console.error('Get courses error:', error);
      return []; // Return empty array instead of throwing error
    }
  },

  // Get single course with videos
  async getCourse(id: number): Promise<Course | null> {
    try {
      // Change the type annotation to include the wrapper
      const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
      
      // Check if we got a successful response with data
      if (response && response.success && response.data) {
        return response.data;
      }
      
      console.warn('API returned unsuccessful response or no data:', response.message);
      return null;
    } catch (error) {
      console.error('Get course error:', error);
      return null; // Return null instead of throwing error
    }
  },

  // Create course (admin only)
  async createCourse(courseData: Partial<Course>): Promise<Course | null> {
    try {
      // Change the type annotation to include the wrapper
      const response = await api.post<ApiResponse<Course>>('/courses', courseData);
      
      // Check if we got a successful response with data
      if (response && response.success && response.data) {
        return response.data;
      }
      
      console.warn('API returned unsuccessful response or no data:', response.message);
      return null;
    } catch (error) {
      console.error('Create course error:', error);
      return null; // Return null instead of throwing error
    }
  },

  // Update course (admin only)
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | null> {
    try {
      // Change the type annotation to include the wrapper
      const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, courseData);
      
      // Check if we got a successful response with data
      if (response && response.success && response.data) {
        return response.data;
      }
      
      console.warn('API returned unsuccessful response or no data:', response.message);
      return null;
    } catch (error) {
      console.error('Update course error:', error);
      return null; // Return null instead of throwing error
    }
  },

  // Delete course (admin only)
  async deleteCourse(id: number): Promise<boolean> {
    try {
      // Change the type annotation to include the wrapper
      const response = await api.delete<ApiResponse<void>>(`/courses/${id}`);
      
      // Check if we got a successful response
      if (response && response.success) {
        return true;
      }
      
      console.warn('API returned unsuccessful response:', response.message);
      return false;
    } catch (error) {
      console.error('Delete course error:', error);
      return false; // Return false instead of throwing error
    }
  }
};