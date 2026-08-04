import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zgtVeCf1Fn9q@ep-dry-shape-aybt06zh-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

  const sql = neon(databaseUrl);

  try {
    // Asegurar que la tabla existe en Neon
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT,
        icon TEXT,
        content TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, title, icon, content, images FROM services ORDER BY id ASC`;
      return res.status(200).json({ data: rows });
    }

    if (req.method === 'POST') {
      const { rows } = req.body || {};
      if (!Array.isArray(rows)) {
        return res.status(400).json({ error: 'Se requiere un array de filas "rows"' });
      }

      for (const s of rows) {
        const imagesVal = typeof s.images === 'string' ? s.images : JSON.stringify(s.images || []);
        await sql`
          INSERT INTO services (id, title, icon, content, images)
          VALUES (${s.id}, ${s.title || ''}, ${s.icon || ''}, ${s.content || ''}, ${imagesVal})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            icon = EXCLUDED.icon,
            content = EXCLUDED.content,
            images = EXCLUDED.images;
        `;
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (id) {
        await sql`DELETE FROM services WHERE id = ${id}`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API services Neon:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
