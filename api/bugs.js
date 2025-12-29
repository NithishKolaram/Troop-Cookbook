import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { rows } = await pool.query(
        "SELECT * FROM bug_reports ORDER BY reported_at DESC"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { reporter_name, description } = req.body;

      await pool.query(
        `INSERT INTO bug_reports
         (reporter_name, description, status, reported_at)
         VALUES ($1,$2,'open',NOW())`,
        [reporter_name, description]
      );

      return res.status(201).json({ success: true });
    }

    if (req.method === "PATCH") {
      const { id } = req.body;
      await pool.query(
        "UPDATE bug_reports SET status='resolved' WHERE id=$1",
        [id]
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      await pool.query("DELETE FROM bug_reports WHERE id=$1", [id]);
      return res.status(200).json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}