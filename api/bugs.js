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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const currentPool = getPool();

    if (req.method === "GET") {
      const { rows } = await currentPool.query(
        "SELECT * FROM bug_reports ORDER BY reported_at DESC"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { reporter_name, description } = req.body;

      await currentPool.query(
        `INSERT INTO bug_reports
         (reporter_name, description, status, reported_at)
         VALUES ($1,$2,'open',NOW())`,
        [reporter_name, description]
      );

      return res.status(201).json({ success: true });
    }

    if (req.method === "PATCH") {
      const { id } = req.body;
      await currentPool.query(
        "UPDATE bug_reports SET status='resolved' WHERE id=$1",
        [id]
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      await currentPool.query("DELETE FROM bug_reports WHERE id=$1", [id]);
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