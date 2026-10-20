import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sharingSource = readFileSync(new URL('../referral-sharing.js', import.meta.url), 'utf8');
const context = { URLSearchParams, encodeURIComponent, decodeURIComponent, URL };
context.globalThis = context;
runInNewContext(sharingSource, context);
const share = context.PALCYAIReferral;

test('loads the referral flow from the live discovery page', () => {
  assert.match(html, /referral-sharing\.js/);
  assert.match(html, /summaryRefer/);
});

test('creates the exact public discovery share payload without private answers', () => {
  const payload = share.makeSharePayload();
  assert.equal(payload.url, 'https://advisor-financial-insurance.pages.dev/');
  assert.equal(payload.title, 'PALCYAI Financial Discovery');
  assert.match(payload.text, /My personal answers are not shared/);
  assert.doesNotMatch(JSON.stringify(payload), /@|555|summary|priorityRoadmap/i);
});

test('normalizes only contacts returned from the explicit device picker and defaults those selected contacts on', () => {
  const contacts = share.normalizeContacts([
    { name: ['Jordan'], email: ['jordan@example.test'], tel: ['+19055550111'] },
    { name: ['Sam'], tel: ['+19055550112'] },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(contacts)), [
    { name: 'Jordan', emails: ['jordan@example.test'], phones: ['+19055550111'], selected: true },
    { name: 'Sam', emails: [], phones: ['+19055550112'], selected: true },
  ]);
});

test('shows Select all checked only when every visible contact is selected', () => {
  assert.equal(share.areAllSelected([]), false);
  assert.equal(share.areAllSelected([{ selected: true }, { selected: true }]), true);
  assert.equal(share.areAllSelected([{ selected: true }, { selected: false }]), false);
});
test('only enables contact selection in a secure context with a device picker', () => {
  const nav = { contacts: { select() {} } };
  assert.equal(share.isContactPickerAvailable(nav, { isSecureContext: true }), true);
  assert.equal(share.isContactPickerAvailable(nav, { isSecureContext: false }), false);
  assert.equal(share.isContactPickerAvailable({}, { isSecureContext: true }), false);
});

test('invokes the device contact picker immediately from the click handler', async () => {
  const calls = [];
  const pending = share.beginContactSelection({ contacts: { select(properties, options) { calls.push({ properties, options }); return Promise.resolve([]); } } }, ['name', 'email', 'tel']);
  assert.equal(JSON.stringify(calls), JSON.stringify([{ properties: ['name', 'email', 'tel'], options: { multiple: true } }]));
  await pending;
});
test('does not transmit contact data to a server', () => {
  assert.doesNotMatch(sharingSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
test('creates a reviewed BCC email draft only for contacts still selected', () => {
  const href = share.makeEmailDraft([
    { emails: ['jordan@example.test'], selected: true },
    { emails: ['sam@example.test'], selected: false },
  ]);
  const url = new URL(href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.searchParams.get('bcc'), 'jordan@example.test');
  assert.match(decodeURIComponent(url.searchParams.get('body')), /https:\/\/advisor-financial-insurance\.pages\.dev\//);
});

test('creates a reviewed SMS draft for one explicitly selected phone number', () => {
  const href = share.makeSmsDraft('+19055550111');
  assert.match(href, /^sms:/);
  assert.match(decodeURIComponent(href), /https:\/\/advisor-financial-insurance\.pages\.dev\//);
});

test('creates copyable in-page email and text draft content', () => {
  const email = share.makeEmailDraftContent([
    { emails: ['jordan@example.test'], selected: true },
    { emails: ['sam@example.test'], selected: false },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(email)), {
    to: '',
    bcc: 'jordan@example.test',
    subject: 'A financial discovery resource for you',
    body: expectShareBody(),
  });
  assert.match(share.makeTextDraftContent(), /https:\/\/advisor-financial-insurance\.pages\.dev\//);
});

test('referral modal keeps email and text creation as in-page buttons and contact fallback enabled', () => {
  assert.match(sharingSource, /id="palcyai-email-draft" type="button"/);
  assert.match(sharingSource, /id="palcyai-sms-draft" type="button"/);
  assert.match(sharingSource, /id="palcyai-message-draft"/);
  assert.doesNotMatch(sharingSource, /pickerButton\.disabled\s*=\s*true/);
});

function expectShareBody() {
  return `${share.makeSharePayload().text}\n\n${share.makeSharePayload().url}`;
}




