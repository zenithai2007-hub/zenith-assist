/* Zenith Assist — voice + text chat */
const $ = id => document.getElementById(id);
const msgs = [], MAXH = 14;
let voiceOn = true, orderStep = 0, order = {}, listening = false, recog = null;

function addMsg(text, who) {
  const d = document.createElement('div');
  d.className = 'msg ' + who; d.textContent = text;
  $('msgs').appendChild(d); $('msgs').scrollTop = $('msgs').scrollHeight;
  return d;
}
function stripEmoji(s){ return s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu,'').trim(); }

/* ---------- voice out ---------- */
function speak(text) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripEmoji(text));
  u.lang = 'en-PK'; u.rate = 1; u.pitch = 1;
  speechSynthesis.speak(u);
}
$('speakertgl').onclick = () => {
  voiceOn = !voiceOn;
  $('speakertgl').classList.toggle('on', voiceOn);
  $('speakertgl').textContent = voiceOn ? '🔊' : '🔇';
  if (!voiceOn && 'speechSynthesis' in window) speechSynthesis.cancel();
};

/* ---------- voice in ---------- */
function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { addMsg('Sorry, is browser mein voice input nahi chalega — Chrome use karo ya likh do.', 'bot'); return; }
  if (listening) { recog.stop(); return; }
  recog = new SR();
  recog.lang = 'en-PK'; recog.interimResults = false; recog.maxAlternatives = 1;
  recog.onstart = () => { listening = true; $('micbtn').classList.add('listening'); $('micbtn').textContent = '⏹️'; };
  recog.onend = () => { listening = false; $('micbtn').classList.remove('listening'); $('micbtn').textContent = '🎤'; };
  recog.onerror = e => { addMsg('Mic mein masla hua (' + e.error + ') — likh kar bhej do.', 'bot'); };
  recog.onresult = e => {
    const t = e.results[0][0].transcript.trim();
    if (t) sendUser(t);
  };
  try { recog.start(); } catch (e) {}
}
$('micbtn').onclick = toggleMic;

/* ---------- chat ---------- */
async function askBrain(userText) {
  msgs.push({ role: 'user', content: userText });
  const hist = msgs.slice(-MAXH);
  const typing = addMsg('likh raha hai…', 'bot typing');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: hist }),
    });
    const j = await r.json();
    typing.remove();
    const reply = (j.reply || '').trim() || 'Sorry, samajh nahi aaya — phir se bolo!';
    msgs.push({ role: 'assistant', content: reply });
    addMsg(reply, 'bot'); speak(reply);
  } catch (e) {
    typing.remove();
    const fb = 'Net slow lag raha hai — phir se try karo!';
    addMsg(fb, 'bot'); speak(fb);
  }
}

/* ---------- order flow ---------- */
const ORDER_Q = [
  null,
  'Zabardast! 🎉 Bas apna **naam** bata do.',
  'Shukriya {name}! Ab apna **phone/WhatsApp number** likh do.',
  'Aur kaunsi service chahiye — **Website** ya **AI Agent**?',
];
function startOrder() { orderStep = 1; order = {}; const m = addMsg(ORDER_Q[1], 'bot'); speak(stripEmoji(ORDER_Q[1])); }
function orderNext(text) {
  if (orderStep === 1) { order.name = text; orderStep = 2; const q = ORDER_Q[2].replace('{name}', text.split(' ')[0]); addMsg(q, 'bot'); speak(stripEmoji(q)); }
  else if (orderStep === 2) { order.phone = text; orderStep = 3; addMsg(ORDER_Q[3], 'bot'); speak(stripEmoji(ORDER_Q[3])); }
  else if (orderStep === 3) { order.service = text; orderStep = 4;
    const c = 'Confirm karun? Naam: ' + order.name + ', Phone: ' + order.phone + ', Service: ' + order.service + ' — "haan" likho ya bolo!';
    addMsg(c, 'bot'); speak(stripEmoji(c)); }
  else if (orderStep === 4) {
    if (/haan|yes|confirm|ok|theek/i.test(text)) { submitOrder(); }
    else { orderStep = 0; addMsg('Koi baat nahi! Jab ready ho, "order" likh dena.', 'bot'); }
  }
}
function transcriptText() {
  return msgs.map(m => (m.role === 'user' ? 'Client' : 'Assist') + ': ' + m.content).join('\n');
}
async function submitOrder() {
  orderStep = 0;
  addMsg('Order bhej raha hun… ⏳', 'bot');
  try {
    const r = await fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'order', transcript: transcriptText(), ...order }),
    });
    const j = await r.json();
    if (j.via === 'mailto' && j.mailto) window.location.href = j.mailto;
    const done = 'Ho gaya! ✅ Tumhara order founder ko bhej diya — poori baat-cheet ke saath. Woh khud rabta karega. Shukriya!';
    addMsg(done, 'bot'); speak(stripEmoji(done));
  } catch (e) { addMsg('Order bhejne mein masla hua — phir try karo.', 'bot'); }
}
async function reportPaymentIssue() {
  addMsg('Founder ko ittila bhej raha hun… ⏳', 'bot');
  try {
    const r = await fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'payment_issue', transcript: transcriptText(), name: order.name || '-', phone: order.phone || '-' }),
    });
    const j = await r.json();
    if (j.via === 'mailto' && j.mailto) window.location.href = j.mailto;
    const done = 'Bhej diya! ⚠️ Founder ko payment issue ki ittila mil gayi — woh foran rabta karega.';
    addMsg(done, 'bot'); speak(stripEmoji(done));
  } catch (e) { addMsg('Bhejne mein masla hua — phir try karo.', 'bot'); }
}

function sendUser(text) {
  text = text.trim(); if (!text) return;
  addMsg(text, 'user');
  $('msgin').value = '';
  if (orderStep > 0) { orderNext(text); return; }
  if (/order|book|lena hai|buy|kharid/i.test(text) && !/price|cost|fee|pais/i.test(text)) { startOrder(); return; }
  askBrain(text);
}
$('sendbtn').onclick = () => sendUser($('msgin').value);
$('msgin').addEventListener('keydown', e => { if (e.key === 'Enter') sendUser($('msgin').value); });
document.querySelectorAll('.qchip').forEach(c => c.onclick = () => {
  const t = c.textContent.trim();
  if (/payment/i.test(t)) { addMsg(t, 'user'); reportPaymentIssue(); }
  else if (/order/i.test(t)) { addMsg(t, 'user'); startOrder(); }
  else sendUser(t);
});

/* ---------- greeting ---------- */
window.addEventListener('load', () => {
  setTimeout(() => {
    const g = 'Assalam-o-Alaikum! Hello! 🙌 Main Assist hun — Zenith AI ka bolne wala agent. Batao, what is your business? Website chahiye ya AI WhatsApp agent? Bolo ya likho — dono chalega! 🎤';
    addMsg(g, 'bot');
  }, 600);
});
