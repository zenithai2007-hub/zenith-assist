/* Owner console API: passcode gate. (Live-chat relay arrives with Supabase.) */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const code = process.env.OWNER_CODE || 'assist123';
  const { action, pass } = req.body || {};
  if (pass !== code) return res.status(403).json({ error: 'wrong code' });
  if (action === 'verify') return res.status(200).json({ ok: true, liveChat: false });
  return res.status(400).json({ error: 'unknown action' });
};
