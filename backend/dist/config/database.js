"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Database {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.pool.on('connect', () => {
            console.log('🔗 Connected to PostgreSQL database');
        });
        this.pool.on('error', (err) => {
            console.error('❌ Unexpected error on idle client', err);
            process.exit(-1);
        });
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('📊 Executed query', { text, duration, rows: res.rowCount });
            return res;
        }
        catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    }
    async getClient() {
        return this.pool.connect();
    }
    async close() {
        await this.pool.end();
    }
    async initialize() {
        console.log('🚀 Initializing database...');
        try {
            await this.createTables();
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    async createTables() {
        const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT FALSE,
        last_ip INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        cover_image TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Videos table
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        duration INTEGER, -- Duration in seconds
        order_index INTEGER DEFAULT 1,
        is_free BOOLEAN DEFAULT FALSE,
        thumbnail TEXT,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Blog posts table
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        published BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        featured_image TEXT,
        read_time INTEGER DEFAULT 5,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        category VARCHAR(100),
        tags TEXT[], -- Array of strings
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Enrollments table
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        progress INTEGER DEFAULT 0, -- Progress percentage
        completed BOOLEAN DEFAULT FALSE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(user_id, course_id)
      );

      -- Certificates table
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        certificate_url TEXT,
        UNIQUE(user_id, course_id)
      );

      -- Contact forms table
      CREATE TABLE IF NOT EXISTS contact_forms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_urgent BOOLEAN DEFAULT FALSE,
        user_id INTEGER REFERENCES users(id),
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
      CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
      CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for updated_at
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
      CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
      CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
      CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
      CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
        await this.query(createTablesSQL);
    }
}
exports.default = new Database();
