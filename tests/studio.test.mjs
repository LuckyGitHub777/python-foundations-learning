import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function element(dataset = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();
  return {
    dataset,
    textContent: '',
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    classList: {
      toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
    fire(name) { assert.ok(listeners.has(name)); return listeners.get(name)(); },
  };
}

function makeStudio(withClipboard = true) {
  const ids = ['code-file', 'chapter-caption', 'code-content', 'output-content',
    'progress', 'feedback', 'run-button', 'copy-button'];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  const chapters = ['origins', 'collections', 'decisions', 'functions'];
  const buttons = chapters.map(chapter => element({ chapter }));
  const copied = [];
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, 'button[data-chapter]');
      return buttons;
    },
    getElementById(id) {
      assert.ok(Object.hasOwn(nodes, id), `Unknown node: ${id}`);
      return nodes[id];
    },
  };
  const navigator = withClipboard
    ? { clipboard: { writeText: async text => copied.push(text) } }
    : {};
  vm.runInNewContext(source, { document, navigator }, { timeout: 1000 });
  return { nodes, buttons, copied };
}

test('all four chapters select, display curated output and announce progress', () => {
  const { nodes, buttons } = makeStudio();
  const cases = [
    ['01_origins.py', 'Hello, world!'],
    ['02_collections.py', 'Cobalt\nAmber\nIvory'],
    ['03_decisions.py', 'Ready to begin'],
    ['04_functions.py', 'Welcome to Python'],
  ];
  cases.forEach(([filename, output], index) => {
    buttons[index].fire('click');
    assert.equal(nodes['code-file'].textContent, filename);
    assert.match(nodes['output-content'].textContent, /Illustrative output/);
    assert.equal(nodes.progress.textContent, `${String(index + 1).padStart(2, '0')} / 04 EXPLORED`);
    for (let i = 0; i < buttons.length; i++) {
      assert.equal(buttons[i].getAttribute('aria-pressed'), String(i === index));
      assert.equal(buttons[i].classList.contains('active'), i === index);
    }
    nodes['run-button'].fire('click');
    assert.equal(nodes['output-content'].textContent, output);
    assert.match(nodes.feedback.textContent, /illustrative result revealed/i);
  });
});

test('copy sends only the selected example to the clipboard', async () => {
  const { nodes, buttons, copied } = makeStudio();
  buttons[3].fire('click');
  const code = nodes['code-content'].textContent;
  await nodes['copy-button'].fire('click');
  assert.deepEqual(copied, [code]);
  assert.match(nodes.feedback.textContent, /example code copied/i);
});

test('offline missing-clipboard fallback does not break the studio', async () => {
  const { nodes, buttons } = makeStudio(false);
  buttons[1].fire('click');
  await nodes['copy-button'].fire('click');
  assert.match(nodes.feedback.textContent, /copy is unavailable here/i);
  nodes['run-button'].fire('click');
  assert.equal(nodes['output-content'].textContent, 'Cobalt\nAmber\nIvory');
});

test('source does not contain a runtime code evaluator or network call', () => {
  assert.doesNotMatch(source, /\b(?:eval|fetch|XMLHttpRequest|WebSocket|localStorage)\s*\(/);
  assert.doesNotMatch(source, /new\s+Function\s*\(/);
});
