import { SVGDocument, GroupShape, RectShape, CircleShape, TextShape, LineShape } from '../core';
import {
  CommandInvoker,
  CreateCommand,
  DeleteCommand,
  MoveCommand,
  GroupCommand,
  UngroupCommand,
  SetCommand,
  ScaleCommand,
} from '../commands';
import { SVGParser } from '../parser';

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

console.log('Running tests...\n');

// === Core Tests ===
console.log('Core:');

test('create rect', () => {
  const doc = new SVGDocument();
  const rect = new RectShape('r1');
  rect.setAttr('x', '10');
  rect.setAttr('y', '20');
  doc.addChild(rect);
  assertEqual(doc.findShape('r1')?.tag, 'rect');
});

test('group contains child', () => {
  const g = new GroupShape('g1');
  const r = new RectShape('r1');
  g.addChild(r);
  assertTrue(g.containsDescendant('r1'));
});

test('text shape', () => {
  const t = new TextShape('t1');
  t.text = 'hello';
  assertEqual(t.text, 'hello');
});

// === Command Tests ===
console.log('\nCommands:');

test('create command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  const cmd = new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null);
  const result = invoker.execute(cmd);
  assertTrue(result.includes('created'));
  assertEqual(doc.findShape('r1')?.tag, 'rect');
});

test('undo create', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  const result = invoker.undo();
  assertTrue(result.includes('deleted'));
  assertEqual(doc.findShape('r1'), null);
});

test('redo create', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.undo();
  const result = invoker.redo();
  assertTrue(result.includes('created'));
  assertEqual(doc.findShape('r1')?.tag, 'rect');
});

test('move command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new MoveCommand(doc, 'r1', 5, 10));
  const r = doc.findShape('r1') as RectShape;
  assertEqual(r.getAttr('x'), '15');
  assertEqual(r.getAttr('y'), '30');
});

test('undo move', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new MoveCommand(doc, 'r1', 5, 10));
  invoker.undo();
  const r = doc.findShape('r1') as RectShape;
  assertEqual(r.getAttr('x'), '10');
  assertEqual(r.getAttr('y'), '20');
});

test('group command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new CreateCommand(doc, 'circle', 'c1', { cx: '50', cy: '50', r: '20' }, null, null));
  invoker.execute(new GroupCommand(doc, 'g1', ['r1', 'c1']));
  const g = doc.findShape('g1') as GroupShape;
  assertEqual(g.children.length, 2);
});

test('ungroup command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new CreateCommand(doc, 'circle', 'c1', { cx: '50', cy: '50', r: '20' }, null, null));
  invoker.execute(new GroupCommand(doc, 'g1', ['r1', 'c1']));
  invoker.execute(new UngroupCommand(doc, 'g1'));
  assertEqual(doc.findShape('g1'), null);
  assertEqual(doc.findShape('r1')?.parent, doc);
});

test('scale command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new ScaleCommand(doc, 'r1', 2));
  const r = doc.findShape('r1') as RectShape;
  assertEqual(r.getAttr('x'), '20');
  assertEqual(r.getAttr('width'), '200');
});

test('set command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new SetCommand(doc, 'r1', 'fill', 'red'));
  const r = doc.findShape('r1') as RectShape;
  assertEqual(r.getAttr('fill'), 'red');
});

test('delete command', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new DeleteCommand(doc, 'r1'));
  assertEqual(doc.findShape('r1'), null);
});

test('undo delete', () => {
  const doc = new SVGDocument();
  const invoker = new CommandInvoker();
  invoker.execute(new CreateCommand(doc, 'rect', 'r1', { x: '10', y: '20', width: '100', height: '50' }, null, null));
  invoker.execute(new DeleteCommand(doc, 'r1'));
  invoker.undo();
  assertEqual(doc.findShape('r1')?.tag, 'rect');
});

// === Parser Tests ===
console.log('\nParser:');

test('parse simple svg', () => {
  const xml = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect id="r1" x="0" y="0" width="400" height="300" fill="#fff"/>
  <circle id="c1" cx="50" cy="50" r="10"/>
</svg>`;
  const parser = new SVGParser();
  const result = parser.parse(xml);
  assertEqual(result.width, 400);
  assertEqual(result.height, 300);
  assertEqual(result.children.length, 2);
});

test('parse with auto id', () => {
  const xml = `<svg width="100" height="100"><rect x="0" y="0" width="10" height="10"/></svg>`;
  const parser = new SVGParser();
  const result = parser.parse(xml);
  assertTrue(result.warnings.length > 0);
  assertTrue(result.warnings[0].includes('rect1'));
});

test('parse nested group', () => {
  const xml = `<svg width="100" height="100">
    <g id="g1">
      <rect id="r1" x="0" y="0" width="10" height="10"/>
    </g>
  </svg>`;
  const parser = new SVGParser();
  const result = parser.parse(xml);
  assertEqual(result.children.length, 1);
  const g = result.children[0] as GroupShape;
  assertEqual(g.children.length, 1);
});

// === Document Serialization ===
console.log('\nSerialization:');

test('serialize document', () => {
  const doc = new SVGDocument();
  doc.width = 400;
  doc.height = 300;
  const rect = new RectShape('r1');
  rect.setAttr('x', '10');
  rect.setAttr('y', '20');
  doc.addChild(rect);
  const xml = doc.toXmlString('');
  assertTrue(xml.includes('width="400"'));
  assertTrue(xml.includes('id="r1"'));
});

console.log(`\n==============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`==============================`);

process.exit(failed > 0 ? 1 : 0);