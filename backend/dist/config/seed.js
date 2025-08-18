"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("./database"));
async function seed() {
    console.log('🌱 Starting database seed...');
    try {
        const adminPassword = await bcryptjs_1.default.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 12);
        const adminResult = await database_1.default.query(`
      INSERT INTO users (name, email, password, is_admin, is_approved)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        is_admin = EXCLUDED.is_admin,
        is_approved = EXCLUDED.is_approved
      RETURNING id, email
    `, [
            'Medsaidabidi02',
            process.env.DEFAULT_ADMIN_EMAIL || 'admin@cliniquejuriste.com',
            adminPassword,
            true,
            true
        ]);
        console.log('👑 Admin user created:', adminResult.rows[0].email);
        const courseResult = await database_1.default.query(`
      INSERT INTO courses (title, description, slug, price, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price
      RETURNING id, title
    `, [
            'Introduction au Droit Civil',
            'Un cours complet sur les fondamentaux du droit civil français et ses applications pratiques.',
            'introduction-droit-civil',
            99.99,
            true
        ]);
        console.log('📚 Sample course created:', courseResult.rows[0].title);
        await database_1.default.query(`
      INSERT INTO videos (title, description, video_url, duration, order_index, is_free, course_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [
            'Introduction - Les bases du droit civil',
            'Premier cours d\'introduction aux concepts fondamentaux du droit civil français.',
            'https://example.com/sample-video.mp4',
            1800,
            1,
            true,
            courseResult.rows[0].id
        ]);
        const blogContent = `
# Les évolutions du droit du travail en 2025

Le droit du travail continue d'évoluer pour s'adapter aux nouveaux défis du monde professionnel moderne.

## Principales nouveautés

### 1. Télétravail et droit à la déconnexion
- Nouvelles réglementations sur le droit à la déconnexion
- Encadrement des horaires de travail à distance
- Protection de la vie privée des salariés

### 2. Intelligence Artificielle dans le recrutement
- Protection des données personnelles des candidats
- Encadrement de l'IA dans les processus de sélection
- Transparence des algorithmes de recrutement

### 3. Nouvelles formes de contrats
- Adaptation aux travailleurs indépendants
- Encadrement des plateformes numériques
- Protection sociale renforcée

## Impact sur les entreprises

Ces évolutions nécessitent une adaptation des pratiques RH et une mise à jour des politiques internes.

## Conclusion

Le droit du travail de 2025 marque une étape importante dans l'adaptation aux nouvelles réalités du monde professionnel.
    `;
        await database_1.default.query(`
      INSERT INTO blog_posts (title, content, slug, excerpt, published, is_featured, category, tags, read_time, author_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt
    `, [
            'Les évolutions du droit du travail en 2025',
            blogContent,
            'evolutions-droit-travail-2025',
            'Découvrez les principales évolutions du droit du travail pour l\'année 2025 et leur impact sur les entreprises.',
            true,
            true,
            'Droit du Travail',
            ['droit du travail', '2025', 'évolutions', 'télétravail', 'IA'],
            8,
            adminResult.rows[0].id
        ]);
        console.log('📝 Sample blog post created');
        console.log('✅ Database seed completed successfully!');
    }
    catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seed();
}
exports.default = seed;
