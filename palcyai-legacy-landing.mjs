export const ADVISOR_INTAKE_URL = 'https://yzeomkrvncewnrbvhuui.supabase.co/functions/v1/advisor-intake';
export const CONSENT_VERSION = 'advisor-intake-consent-v1';

export function buildLegacyIntakePayload({ firstName, email, priority, idempotencyKey }) {
  const name = String(firstName ?? '').trim().slice(0, 100);
  const address = String(email ?? '').trim().toLowerCase().slice(0, 254);
  const selectedPriority = String(priority ?? 'general').trim().toLowerCase();
  const key = String(idempotencyKey ?? '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter your first name and a valid email address.');
  if (!['protection', 'retirement', 'debt', 'general'].includes(selectedPriority)) throw new Error('Choose a topic before submitting.');
  if (!/^[A-Za-z0-9._:-]{8,100}$/.test(key)) throw new Error('The request could not be prepared. Please refresh the page and try again.');
  return {
    firstName: name,
    email: address,
    consent: true,
    smsConsent: false,
    consentTextVersion: CONSENT_VERSION,
    selectedPriority,
    language: 'en',
    source: 'legacy-landing',
    campaign: 'legacy-blueprint-landing-v1',
    idempotencyKey: key
  };
}

export async function sendLegacyIntakeRequest(payload, fetchImpl = fetch) {
  const response = await fetchImpl(ADVISOR_INTAKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.idempotencyKey },
    body: JSON.stringify(payload),
    credentials: 'omit'
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('We could not securely receive your request. Please try again later.');
  if (!result.reference) throw new Error('We could not confirm that your request was saved. Please try again later.');
  return result;
}

export function bindLegacyLandingForm(documentRef = document, fetchImpl = fetch) {
  const form = documentRef.getElementById('leadForm');
  if (!form) return;
  const button = documentRef.getElementById('submitBtn');
  const status = documentRef.getElementById('statusMsg');
  const guideActions = documentRef.getElementById('guideActions');
  let idempotencyKey = null;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || button.disabled) return;
    idempotencyKey ||= `legacy-${globalThis.crypto.randomUUID()}`;
    const rawName = documentRef.getElementById('name').value.trim();
    const payload = buildLegacyIntakePayload({
      firstName: rawName.split(/\s+/)[0],
      email: documentRef.getElementById('email').value,
      priority: documentRef.getElementById('interest').value,
      idempotencyKey
    });
    button.disabled = true;
    button.textContent = 'Sending securely…';
    status.textContent = 'Submitting your consented request to the secure advisor intake…';
    try {
      await sendLegacyIntakeRequest(payload, fetchImpl);
      status.textContent = 'Your request was saved. The educational guide is available below. Email delivery is not confirmed by this page.';
      guideActions.hidden = false;
      button.textContent = 'Request received';
      idempotencyKey = null;
    } catch (error) {
      status.textContent = error.message || 'We could not confirm your request. Please try again later.';
      button.disabled = false;
      button.textContent = 'Request My Free Guide';
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => bindLegacyLandingForm());
}
