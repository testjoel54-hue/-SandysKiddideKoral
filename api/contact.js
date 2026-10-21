// Vercel Node.js serverless API. WEB3FORMS_ACCESS_KEY remains server-side.
const API_URL = 'https://api.web3forms.com/submit';

function tidy(value, limit = 150) {
  return typeof value === 'string'
    ? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, limit)
    : '';
}
function emailOK(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 200;
}
function json(res, status, result) {
  res.status(status).json(result);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'method_not_allowed' });
  }
  let input = req.body;
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { return json(res, 400, { success: false, error: 'invalid_json' }); }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return json(res, 400, { success: false, error: 'invalid_request' });
  }
  if (JSON.stringify(input).length > 9000) {
    return json(res, 413, { success: false, error: 'too_large' });
  }
  // Silent success for honeypot, without contacting the email provider.
  if (tidy(input.website, 200)) return json(res, 200, { success: true });
  const name = tidy(input.name, 120);
  const email = tidy(input.email, 200);
  const phone = tidy(input.phone, 45);
  const ageGroup = tidy(input.ageGroup, 80);
  const interest = tidy(input.interest, 80);
  const message = tidy(input.message, 2500);
  const allowedTopics = new Set(['Care availability','Preschool details','Transportation','Subsidy and fees','Request a visit','Something else']);
  if (name.length < 2 || !emailOK(email) || !allowedTopics.has(interest) || message.length < 10) {
    return json(res, 400, { success: false, error: 'invalid_fields' });
  }
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!key || key.trim().startsWith('YOUR_')) {
    return json(res, 503, { success: false, error: 'form_not_configured' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: key,
        from_name: "Sandy's Kiddie Korral Website",
        subject: "New childcare inquiry - Sandy's Kiddie Korral",
        name, email, phone: phone || 'Not provided',
        age_group: ageGroup || 'Not specified', inquiry_topic: interest,
        message: ["SANDY'S KIDDIE KORRAL - NEW FAMILY INQUIRY",'',
          'Parent / guardian: ' + name, 'Email: ' + email,
          'Phone: ' + (phone || 'Not provided'),
          'Age group: ' + (ageGroup || 'Not specified'),
          'Inquiry topic: ' + interest, '', 'MESSAGE', message].join('\n'),
        botcheck: false
      })
    });
    const result = await upstream.json().catch(() => null);
    if (upstream.ok && result?.success === true) return json(res, 200, { success: true });
    if (upstream.status === 429) return json(res, 429, { success: false, error: 'rate_limited' });
    return json(res, 502, { success: false, error: 'delivery_failed' });
  } catch {
    return json(res, 502, { success: false, error: 'delivery_unavailable' });
  } finally {
    clearTimeout(timer);
  }
}
