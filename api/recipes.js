import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    // Debug: Check if DATABASE_URL exists
    if (!connectionString) {
      console.error('DATABASE_URL is not set!');
      throw new Error('DATABASE_URL environment variable is not configured');
    }
    
    console.log('Initializing database pool...');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }
  return pool;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const currentPool = getPool();

    if (req.method === "GET") {
      console.log('Fetching recipes from database...');
      
      const { rows } = await currentPool.query(
        "SELECT * FROM recipes ORDER BY id ASC"
      );
      
      console.log(`Found ${rows.length} recipes`);
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      console.log('Adding new recipe...');
      const recipe = req.body;

      await currentPool.query(
        `INSERT INTO recipes
         (id, name, type, base_price, servings, ingredients, instructions, nutrition)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          recipe.id,
          recipe.name,
          recipe.type,
          recipe.base_price,
          recipe.servings,
          JSON.stringify(recipe.ingredients),
          JSON.stringify(recipe.instructions),
          JSON.stringify(recipe.nutrition),
        ]
      );

      console.log('Recipe added successfully');
      return res.status(201).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      console.log(`Deleting recipe with id: ${id}`);

      await currentPool.query("DELETE FROM recipes WHERE id = $1", [id]);
      
      console.log('Recipe deleted successfully');
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Database error details:", err);
    
    // Return detailed error information
    return res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      code: err.code,
      hint: err.hint,
      detail: err.detail,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}