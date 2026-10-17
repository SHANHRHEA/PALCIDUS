import test from 'node:test';
import assert from 'node:assert/strict';
import { PATHS, pathFor, nextQuestion, summaryEmail } from '../palcyai-discovery.mjs';

test('retirement path includes only educational registered-savings and government-benefit review topics', () => {
  const route = pathFor('retirement');
  assert.match(route.approach, /RRSP|TFSA/i);
  assert.match(route.approach, /current official/i);
  assert.match(route.prepare, /advisor/i);
  assert.doesNotMatch(JSON.stringify(route), /guaranteed tax savings|specific product is best/i);
});

test('education path routes to RESP education without claiming grant eligibility', () => {
  const route = pathFor('education');
  assert.equal(route.label, 'Education savings');
  assert.match(route.approach, /RESP/i);
  assert.match(route.approach, /eligibility/i);
  assert.match(route.approach, /official/i);
});

test('business path routes to a continuity discussion with human review', () => {
  const route = pathFor('business');
  assert.match(route.approach, /business continuity/i);
  assert.match(route.prepare, /advisor/i);
});

test('question flow adapts to answers while keeping product suitability with the advisor', () => {
  assert.match(nextQuestion('retirement', []), /RRSP|retirement/i);
  assert.match(nextQuestion('retirement', [{ answer: 'I have an RRSP and want to understand retirement income' }]), /RRSP/i);
  const email = summaryEmail('Taylor Example', 'education', {
    version: 'palcy-discovery-v1', emailRequested: true,
    answers: [1, 2, 3, 4].map(i => ({ question: `Question ${i}`, answer: `Answer ${i}` }))
  });
  assert.match(email.text, /RESP/i);
  assert.match(email.text, /not been established/i);
});

test('homepage exposes the added education and business priority routes', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /\['education','Plan for education'/);
  assert.match(html, /\['business','Plan for my business'/);
  assert.match(html, /\['education','Education'/);
});
