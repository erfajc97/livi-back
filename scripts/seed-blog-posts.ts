import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { BlogPost } from '../src/modules/blog/entities/blog-post.entity';

config();

const blogPosts = [
  {
    title: 'Las Mejores Fragancias Orientales de 2024',
    slug: 'mejores-fragancias-orientales-2024',
    excerpt: 'Descubre las fragancias árabes más populares y cautivadoras que están dominando el mercado este año.',
    content: `
      <h2>Introducción</h2>
      <p>Las fragancias orientales han ganado una inmensa popularidad en los últimos años. Con sus notas especiadas, amaderadas y dulces, estas perfumes ofrecen una experiencia olfativa única que perdura durante horas.</p>

      <h2>Top 5 Fragancias Orientales</h2>
      <ol>
        <li><strong>Asad de Lattafa</strong> - Una mezcla perfecta de notas amaderadas y especiadas</li>
        <li><strong>Bade'e Al Oud</strong> - El oud más refinado y elegante</li>
        <li><strong>Raghba</strong> - Dulce, cálido y extremadamente duradero</li>
        <li><strong>Khamrah</strong> - Notas de canela y vainilla perfectamente balanceadas</li>
        <li><strong>Fakhar</strong> - Intenso y masculino, perfecto para la noche</li>
      </ol>

      <h2>¿Por qué elegir fragancias orientales?</h2>
      <p>Las fragancias orientales son conocidas por su longevidad excepcional y su estela potente. Son perfectas para ocasiones especiales y para quienes buscan destacar con un aroma único y memorable.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=600&fit=crop',
    isPublished: true,
    position: 1,
    publishedAt: new Date('2024-01-15'),
  },
  {
    title: 'Guía Completa: Cómo Aplicar Perfume Correctamente',
    slug: 'como-aplicar-perfume-correctamente',
    excerpt: 'Aprende las técnicas profesionales para maximizar la duración y proyección de tus fragancias favoritas.',
    content: `
      <h2>Puntos de Pulsación</h2>
      <p>Los puntos de pulsación son áreas del cuerpo donde las arterias están más cerca de la piel, generando calor que ayuda a difundir la fragancia.</p>

      <h3>Mejores puntos para aplicar perfume:</h3>
      <ul>
        <li>Muñecas (pero no las frotes)</li>
        <li>Detrás de las orejas</li>
        <li>Base del cuello</li>
        <li>Interior de los codos</li>
        <li>Detrás de las rodillas</li>
      </ul>

      <h2>Errores Comunes</h2>
      <p><strong>1. Frotar las muñecas:</strong> Esto rompe las moléculas de la fragancia y reduce su duración.</p>
      <p><strong>2. Aplicar después de vestirse:</strong> Aplica sobre piel limpia e hidratada para mejor fijación.</p>
      <p><strong>3. Usar demasiado:</strong> 2-3 pulverizaciones son suficientes para la mayoría de las fragancias.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&h=600&fit=crop',
    isPublished: true,
    position: 2,
    publishedAt: new Date('2024-02-01'),
  },
  {
    title: 'Diferencias entre EDP, EDT y Perfume Oil',
    slug: 'diferencias-edp-edt-perfume-oil',
    excerpt: 'Entiende las concentraciones de perfume y cuál es la mejor opción según tus necesidades.',
    content: `
      <h2>Concentraciones de Perfume</h2>

      <h3>Perfume / Extrait de Parfum (15-40%)</h3>
      <p>La concentración más alta. Dura todo el día y tiene una proyección moderada pero constante. Ideal para quienes buscan calidad y longevidad.</p>

      <h3>Eau de Parfum - EDP (10-20%)</h3>
      <p>La opción más popular. Excelente balance entre duración, proyección y precio. Dura entre 6-8 horas.</p>

      <h3>Eau de Toilette - EDT (5-15%)</h3>
      <p>Más ligero y fresco. Perfecto para uso diario y clima cálido. Dura 4-6 horas.</p>

      <h3>Perfume Oil (Concentrado)</h3>
      <p>Sin alcohol, 100% aceites aromáticos. Proyección íntima pero duración excepcional. Ideal para pieles sensibles.</p>

      <h2>¿Cuál elegir?</h2>
      <p>Depende de tu estilo de vida, presupuesto y preferencias. Para ocasiones especiales, opta por EDP o Parfum. Para uso diario, EDT es perfecto.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=600&fit=crop',
    isPublished: true,
    position: 3,
    publishedAt: new Date('2024-02-15'),
  },
  {
    title: 'Fragancias Perfectas para Cada Estación del Año',
    slug: 'fragancias-por-estacion',
    excerpt: 'Descubre qué tipo de perfumes funcionan mejor en verano, otoño, invierno y primavera.',
    content: `
      <h2>Primavera: Frescura Floral</h2>
      <p>Opta por fragancias florales ligeras con notas cítricas. Perfectas para el clima templado y el renacimiento de la naturaleza.</p>
      <ul>
        <li>Notas recomendadas: Rosa, jazmín, bergamota, limón</li>
        <li>Ejemplos: Fragancias EDT con base floral</li>
      </ul>

      <h2>Verano: Acuáticas y Cítricas</h2>
      <p>El calor requiere fragancias frescas que no resulten abrumadoras. Las notas marinas y cítricas son ideales.</p>
      <ul>
        <li>Notas recomendadas: Menta, coco, sandía, notas marinas</li>
        <li>Concentración: EDT o Cologne</li>
      </ul>

      <h2>Otoño: Especiadas y Amaderadas</h2>
      <p>A medida que baja la temperatura, puedes usar fragancias más intensas con especias cálidas.</p>
      <ul>
        <li>Notas recomendadas: Canela, cardamomo, cedro, pachulí</li>
        <li>Ejemplos: Fragancias orientales suaves</li>
      </ul>

      <h2>Invierno: Intensas y Duraderas</h2>
      <p>El frío permite usar las fragancias más potentes y dulces sin resultar excesivas.</p>
      <ul>
        <li>Notas recomendadas: Oud, vainilla, ámbar, cuero</li>
        <li>Concentración: EDP o Parfum</li>
      </ul>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&h=600&fit=crop',
    isPublished: true,
    position: 4,
    publishedAt: new Date('2024-03-01'),
  },
  {
    title: 'Cuidado y Almacenamiento de Perfumes',
    slug: 'cuidado-almacenamiento-perfumes',
    excerpt: 'Consejos profesionales para conservar tus fragancias en perfecto estado por más tiempo.',
    content: `
      <h2>Factores que Afectan los Perfumes</h2>

      <h3>1. Luz Solar</h3>
      <p>La luz UV degrada las moléculas aromáticas. Guarda tus perfumes en lugares oscuros o en sus cajas originales.</p>

      <h3>2. Temperatura</h3>
      <p>El calor acelera la oxidación. Mantén tus fragancias a temperatura ambiente, lejos de radiadores y ventanas.</p>

      <h3>3. Humedad</h3>
      <p>Evita el baño como lugar de almacenamiento. La humedad puede alterar la composición del perfume.</p>

      <h2>Mejores Prácticas</h2>
      <ul>
        <li>Mantén los frascos cerrados cuando no los uses</li>
        <li>No agites las botellas (crea burbujas de aire que oxidan el perfume)</li>
        <li>Usa los perfumes dentro de 3-5 años de abrirlos</li>
        <li>Si viajas, usa atomizadores de viaje para no exponer el frasco original</li>
        <li>Organiza tu colección verticalmente para evitar fugas</li>
      </ul>

      <h2>Señales de que un Perfume se Echó a Perder</h2>
      <ul>
        <li>Cambio de color (más oscuro u opaco)</li>
        <li>Olor ácido o a vinagre</li>
        <li>Separación de líquidos en el frasco</li>
        <li>Menor duración de la fragancia</li>
      </ul>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&h=600&fit=crop',
    isPublished: true,
    position: 5,
    publishedAt: new Date('2024-03-15'),
  },
];

async function seedBlogPosts() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'nondecants',
    entities: [BlogPost],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connection initialized');

  const blogPostRepository = dataSource.getRepository(BlogPost);

  try {
    // Check if posts already exist
    const existingPosts = await blogPostRepository.count();
    if (existingPosts > 0) {
      console.log('Blog posts already exist. Skipping seed.');
      await dataSource.destroy();
      return;
    }

    // Create blog posts
    for (const postData of blogPosts) {
      const post = blogPostRepository.create(postData);
      await blogPostRepository.save(post);
      console.log(`Created blog post: ${post.title}`);
    }

    console.log(`\n✅ Successfully created ${blogPosts.length} blog posts!`);
  } catch (error) {
    console.error('Error seeding blog posts:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedBlogPosts();
