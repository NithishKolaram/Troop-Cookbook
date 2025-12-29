import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        "SELECT * FROM recipes ORDER BY id ASC"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const recipe = req.body;

      await pool.query(
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

      await pool.query("DELETE FROM recipes WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}