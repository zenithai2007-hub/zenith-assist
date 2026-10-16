/* Zenith Assist: order → email to founder. Free FormSubmit (one-time activation), mailto fallback. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { name, phone, service } = req.body || {};
  const to = process.env.NOTIFY_EMAIL || 'zenithai2007@gmail.com';
  const subject = '🔔 New Order — Zenith Assist';
  const text = 'New order from Zenith Assist website:\n\nName: ' + (name || '-') +
    '\nPhone: ' + (phone || '-') + '\nService: ' + (service || '-') +
    '\n\nTime: ' + new Date().toISOString();
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: 'Zenith Assist', _subject: subject, message: text }),
    });
    if (r.ok) return res.status(200).json({ ok: true, via: 'email' });
  } catch (e) { /* fallback below */ }
  const mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  return res.status(200).json({ ok: true, via: 'mailto', mailto });
};
