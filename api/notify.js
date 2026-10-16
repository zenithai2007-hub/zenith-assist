/* Zenith Assist: order / payment-issue → email to founder WITH full chat transcript.
   Free FormSubmit (one-time activation by owner), mailto fallback. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { kind, name, phone, service, transcript } = req.body || {};
  const to = process.env.NOTIFY_EMAIL || 'zenithai2007@gmail.com';
  const isPayment = kind === 'payment_issue';
  const subject = isPayment ? '⚠️ Payment Issue — Zenith Assist' : '🔔 New Order — Zenith Assist';
  const head = isPayment
    ? 'A client reported a PAYMENT ISSUE on the Zenith Assist website.'
    : 'New order from Zenith Assist website:';
  const text = head + '\n\nName: ' + (name || '-') +
    '\nPhone: ' + (phone || '-') +
    (service ? '\nService: ' + service : '') +
    '\n\n--- Full chat transcript ---\n' + (transcript || '(empty)') +
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
