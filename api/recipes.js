import { Pool } from "pg";

// Initialize pool only once
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
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
      const { rows } = await currentPool.query(
        "SELECT * FROM recipes ORDER BY id ASC"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
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

      return res.status(201).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;

      await currentPool.query("DELETE FROM recipes WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}