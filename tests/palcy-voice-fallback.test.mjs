import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('PALCY explains when no microphone device exists', () => {
  assert.match(source, /function describeMicrophoneError\(/);
  assert.match(
    source,
    /No microphone was found\. Connect or enable a microphone, then try again\. You can still use Ask PALCY AI by text\./
  );
});
