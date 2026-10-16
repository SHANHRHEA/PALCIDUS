import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildLegacyIntakePayload, sendLegacyIntakeRequest } from '../palcyai-legacy-landing.mjs';

const page = await readFile(new URL('../Palcidus_Patrick_Landing.html', import.meta.url), 'utf8');
const mainPage = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('legacy landing uses explicit consent and opens the canonical PALCY guide and voice', () => {
  assert.match(page, /id="leadConsent"[^>]*required/);
  assert.match(page, /href="\/core-financial-concepts-guide\.html"/);
  assert.match(page, /href="\/?\?voice=1#voiceModal"/);
  assert.match(mainPage, /q\.get\('voice'\)==='1'\)window\.PALCYVoice\?\.openVoice\(\)/);
  assert.doesNotMatch(page, /For demonstration, we simulate success|Palcidus_Patrick_ThankYou\.html|Alex Morgan|apiKey\s*:/);
});

test('legacy intake sends an idempotent, consent-versioned request to the existing endpoint', async () => {
  const payload = buildLegacyIntakePayload({
    firstName: 'Taylor',
    email: 'taylor@example.test',
    priority: 'retirement',
    idempotencyKey: 'test-request-0001'
  });
  assert.equal(payload.firstName, 'Taylor');
  assert.equal(payload.email, 'taylor@example.test');
  assert.equal(payload.selectedPriority, 'retirement');
  assert.equal(payload.consent, true);
  assert.equal(payload.smsConsent, false);
  assert.equal(payload.consentTextVersion, 'advisor-intake-consent-v1');

  let observed;
  const result = await sendLegacyIntakeRequest(payload, async (url, options) => {
    observed = { url, options };
    return { ok: true, status: 201, json: async () => ({ ok: true, reference: 'synthetic-reference' }) };
  });
  assert.equal(observed.url, 'https://yzeomkrvncewnrbvhuui.supabase.co/functions/v1/advisor-intake');
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers['Idempotency-Key'], 'test-request-0001');
  assert.equal(result.reference, 'synthetic-reference');
});

test('legacy intake never reports success when storage fails or lacks a reference', async () => {
  await assert.rejects(
    sendLegacyIntakeRequest(buildLegacyIntakePayload({ firstName: 'Taylor', email: 'taylor@example.test', priority: 'general', idempotencyKey: 'test-request-0002' }), async () => ({ ok: false, status: 503, json: async () => ({ error: 'unavailable' }) })),
    /securely receive/
  );
  await assert.rejects(
    sendLegacyIntakeRequest(buildLegacyIntakePayload({ firstName: 'Taylor', email: 'taylor@example.test', priority: 'general', idempotencyKey: 'test-request-0003' }), async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })),
    /confirm/
  );
});
