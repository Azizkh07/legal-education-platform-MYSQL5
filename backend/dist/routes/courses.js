"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursesRoutes = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const router = express_1.default.Router();
exports.coursesRoutes = router;
router.get('/', async (req, res) => {
    try {
        console.log('📚 Getting courses...');
        try {
            const result = await database_1.pool.query(`
        SELECT id, title, description, cover_image, level, created_at
        FROM courses
        WHERE is_active = true
        ORDER BY created_at DESC
      `);
            console.log('✅ Found real courses:', result.rows.length);
            return res.json(result.rows);
        }
        catch (dbError) {
            console.log('⚠️ Courses table issue, returning sample data:', dbError.message);
            const sampleCourses = [
                {
                    id: 1,
                    title: "Introduction au Droit Civil",
                    description: "Un cours complet sur les bases du droit civil français",
                    cover_image: "/api/placeholder/400/300",
                    level: "Débutant",
                    instructor_name: "Prof. Martin Dubois",
                    duration: "12 heures",
                    lessons_count: 15,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: "Droit des Contrats",
                    description: "Maîtrisez les contrats et leurs implications juridiques",
                    cover_image: "/api/placeholder/400/300",
                    level: "Intermédiaire",
                    instructor_name: "Prof. Sophie Laurent",
                    duration: "8 heures",
                    lessons_count: 10,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    title: "Droit Pénal Général",
                    description: "Les fondamentaux du droit pénal français",
                    cover_image: "/api/placeholder/400/300",
                    level: "Avancé",
                    instructor_name: "Prof. Jean-Pierre Moreau",
                    duration: "16 heures",
                    lessons_count: 20,
                    created_at: new Date().toISOString()
                }
            ];
            console.log('📚 Returning sample courses:', sampleCourses.length);
            return res.json(sampleCourses);
        }
    }
    catch (error) {
        console.error('❌ Get courses error:', error);
        res.json([]);
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📚 Getting course by ID:', id);
        const sampleCourse = {
            id: parseInt(id),
            title: "Introduction au Droit Civil",
            description: "Un cours complet sur les bases du droit civil français",
            content: "Ce cours couvre tous les aspects fondamentaux du droit civil...",
            cover_image: "/api/placeholder/800/400",
            level: "Débutant",
            instructor_name: "Prof. Martin Dubois",
            duration: "12 heures",
            lessons_count: 15,
            lessons: [
                {
                    id: 1,
                    title: "Introduction générale",
                    duration: "45 min",
                    video_url: "/api/placeholder/video"
                },
                {
                    id: 2,
                    title: "Les personnes physiques",
                    duration: "60 min",
                    video_url: "/api/placeholder/video"
                }
            ],
            created_at: new Date().toISOString()
        };
        res.json(sampleCourse);
    }
    catch (error) {
        console.error('❌ Get course error:', error);
        res.status(404).json({ error: 'Course not found' });
    }
});
