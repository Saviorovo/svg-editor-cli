import { CommandDispatcher } from '../cli/CommandDispatcher';
import * as fs from 'fs';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg ? `${msg}: expected ${expected}, got ${actual}` : `expected ${expected}, got ${actual}`);
  }
}

function assertTrue(val: boolean, msg?: string) {
  if (!val) {
    throw new Error(msg ?? 'expected true');
  }
}

console.log('Running CLI Integration Tests...\n');

// === Typical Session Test ===
console.log('Typical Session:');

test('init and create shapes', () => {
  const d = new CommandDispatcher();
  let r = d.dispatch('init', ['800', '600']);
  assertTrue(r.includes('800x600'));

  r = d.dispatch('create', ['rect', 'bg', '0', '0', '800', '600', '#ffffff']);
  assertTrue(r.includes('created'));

  r = d.dispatch('create', ['text', 'title', '20', '40', 'My Diagram']);
  assertTrue(r.includes('created'));

  r = d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);
  assertTrue(r.includes('created'));

  r = d.dispatch('create', ['rect', 'box', '200', '80', '60', '60', '#3366ff']);
  assertTrue(r.includes('created'));
});

test('group and tree', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);
  d.dispatch('create', ['rect', 'box', '200', '80', '60', '60', '#3366ff']);
  const r = d.dispatch('group', ['markers', 'c1', 'box']);
  assertTrue(r.includes('created with 2 children'));

  const tree = d.dispatch('tree', []);
  assertTrue(tree.includes('g#markers'));
});

test('move and undo/redo', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);

  let r = d.dispatch('move', ['c1', '30', '0']);
  assertTrue(r.includes('moved to (130,100)'));

  r = d.dispatch('undo', []);
  assertTrue(r.includes('moved back to (100,100)'));

  r = d.dispatch('redo', []);
  assertTrue(r.includes('moved to (130,100)'));
});

test('set and undo', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['text', 'title', '20', '40', 'My Diagram']);

  let r = d.dispatch('set', ['title', 'text', 'My Diagram v2']);
  assertTrue(r.includes('updated'));

  r = d.dispatch('undo', []);
  assertTrue(r.includes('restored'));
});

test('group descendant error', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);
  d.dispatch('create', ['rect', 'box', '200', '80', '60', '60', '#3366ff']);
  d.dispatch('group', ['markers', 'c1', 'box']);

  const r = d.dispatch('group', ['bad', 'c1', 'markers']);
  assertTrue(r.includes('cannot group a container into its own descendant'));
});

test('delete and undo', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);
  d.dispatch('create', ['rect', 'box', '200', '80', '60', '60', '#3366ff']);
  d.dispatch('group', ['markers', 'c1', 'box']);

  let r = d.dispatch('delete', ['box']);
  assertTrue(r.includes('deleted'));

  r = d.dispatch('undo', []);
  assertTrue(r.includes('restored'));
});

test('save locks undo', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['rect', 'bg', '0', '0', '800', '600', '#ffffff']);

  // Create a temp file for saving
  const tmpFile = 'test-save.svg';
  const r = d.dispatch('save', [tmpFile]);
  assertTrue(r.includes('saved to'));

  const r2 = d.dispatch('undo', []);
  assertTrue(r2.includes('undo not allowed after io command'));

  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
});

test('read with auto id warning', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;
  const tmpFile = 'test-read.svg';
  fs.writeFileSync(tmpFile, xml, 'utf-8');

  const d = new CommandDispatcher();
  const r = d.dispatch('read', [tmpFile]);
  assertTrue(r.includes('warning: assigned id rect1 to unnamed <rect>'));
  assertTrue(r.includes('read test-read.svg'));

  const tree = d.dispatch('tree', []);
  assertTrue(tree.includes('rect#rect1'));

  fs.unlinkSync(tmpFile);
});

test('canvas command', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);

  let r = d.dispatch('canvas', []);
  assertTrue(r.includes('800x600'));

  r = d.dispatch('canvas', ['400', '300']);
  assertTrue(r.includes('400x300'));

  r = d.dispatch('undo', []);
  assertTrue(r.includes('800x600'));
});

test('create in container', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['g', 'node1']);
  const r = d.dispatch('create', ['rect', 'start', '120', '100', '160', '60', '#4a90d9', 'in', 'node1']);
  assertTrue(r.includes('in g#node1'));

  const tree = d.dispatch('tree', []);
  assertTrue(tree.includes('rect#start'));
});

test('front and back', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);
  d.dispatch('create', ['rect', 'r2', '0', '0', '10', '10']);

  let r = d.dispatch('front', ['r1']);
  assertTrue(r.includes('moved to front'));

  r = d.dispatch('back', ['r1']);
  assertTrue(r.includes('moved to back'));
});

test('addto command', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);
  d.dispatch('create', ['g', 'g1']);

  const r = d.dispatch('addto', ['g1', 'r1']);
  assertTrue(r.includes('added to g#g1'));
});

test('scale error for non-positive', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);

  const r = d.dispatch('scale', ['r1', '-1']);
  assertTrue(r.includes('scale factor must be positive'));
});

test('show command', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['circle', 'c1', '100', '100', '20', 'red']);

  const r = d.dispatch('show', ['c1']);
  assertTrue(r.includes('circle#c1'));
  assertTrue(r.includes('cx=100'));
});

test('help command', () => {
  const d = new CommandDispatcher();
  const r = d.dispatch('help', []);
  assertTrue(r.includes('init'));
  assertTrue(r.includes('create'));
});

test('no document error', () => {
  const d = new CommandDispatcher();
  const r = d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);
  assertTrue(r.includes("no document. use 'init' or 'read' first"));
});

test('duplicate id error', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);

  const r = d.dispatch('create', ['rect', 'r1', '0', '0', '10', '10']);
  assertTrue(r.includes('id already exists: r1'));
});

test('unknown shape type', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);

  const r = d.dispatch('create', ['box', 'b1', '0', '0', '10', '10']);
  assertTrue(r.includes('unknown shape type: box'));
});

test('flowchart example', () => {
  const d = new CommandDispatcher();
  d.dispatch('init', ['800', '600']);
  d.dispatch('create', ['g', 'flowchart']);
  d.dispatch('create', ['g', 'node1', 'in', 'flowchart']);
  d.dispatch('create', ['rect', 'start', '120', '100', '160', '60', '#4a90d9', 'in', 'node1']);
  d.dispatch('create', ['text', 'start-label', '155', '135', '开始', 'in', 'node1']);
  d.dispatch('create', ['g', 'node2', 'in', 'flowchart']);
  d.dispatch('create', ['rect', 'process', '520', '100', '160', '60', '#f5a623', 'in', 'node2']);
  d.dispatch('create', ['text', 'process-label', '545', '135', '处理数据', 'in', 'node2']);
  d.dispatch('create', ['line', 'arrow1', '280', '130', '520', '130', 'black', 'in', 'flowchart']);

  const tree = d.dispatch('tree', []);
  assertTrue(tree.includes('g#flowchart'));
  assertTrue(tree.includes('rect#start'));
  assertTrue(tree.includes('text#start-label'));
  assertTrue(tree.includes('line#arrow1'));
});

console.log(`\n==============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`==============================`);

process.exit(failed > 0 ? 1 : 0);