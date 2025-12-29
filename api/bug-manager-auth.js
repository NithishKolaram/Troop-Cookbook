export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    // Get bug manager password from environment variable
    const bugManagerPassword = process.env.BUG_MANAGER_PASSWORD || 'bugmanager123';
    
    console.log('Bug manager auth attempt');
    
    if (password === bugManagerPassword) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (err) {
    console.error('Bug manager auth error:', err);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: err.message 
    });
  }
}