import { Shape, ShapeContainer, TextShape } from '../core';

export class DisplayUtil {
  static tree(doc: ShapeContainer, rootId?: string): string {
    let root: ShapeContainer = doc;
    if (rootId) {
      const found = doc.findShape(rootId);
      if (!found) {
        return `error: no such shape: ${rootId}`;
      }
      if (!('children' in found)) {
        return `error: not a container: ${rootId}`;
      }
      root = found as ShapeContainer;
    }

    if (root === doc) {
      let result = `svg (${doc.getAttr('width')}x${doc.getAttr('height')})`;
      for (const c of doc.children) {
        result += '\n' + this.renderTree(c, '', true);
      }
      return result;
    }

    let result = `${root.tag}#${root.id}`;
    const children = (root as ShapeContainer).children;
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      result += '\n' + this.renderTree(children[i], '', isLast);
    }
    return result;
  }

  private static renderTree(shape: Shape, prefix: string, isLast: boolean): string {
    const branch = isLast ? '└── ' : '├── ';
    const line = prefix + branch + this.inlineShape(shape);

    if (!('children' in shape)) {
      return line;
    }

    const children = (shape as ShapeContainer).children;
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    let result = line;

    for (let i = 0; i < children.length; i++) {
      result += '\n' + this.renderTree(children[i], childPrefix, i === children.length - 1);
    }

    return result;
  }

  private static inlineShape(shape: Shape): string {
    const tag = shape.tag;
    const id = shape.id;

    if (tag === 'rect') {
      const x = shape.getAttr('x') ?? '0';
      const y = shape.getAttr('y') ?? '0';
      const w = shape.getAttr('width') ?? '0';
      const h = shape.getAttr('height') ?? '0';
      const fill = shape.getAttr('fill');
      let s = `rect#${id}\tx=${x} y=${y} w=${w} h=${h}`;
      if (fill) s += ` fill=${fill}`;
      return s;
    }

    if (tag === 'circle') {
      const cx = shape.getAttr('cx') ?? '0';
      const cy = shape.getAttr('cy') ?? '0';
      const r = shape.getAttr('r') ?? '0';
      const fill = shape.getAttr('fill');
      let s = `circle#${id}\tcx=${cx} cy=${cy} r=${r}`;
      if (fill) s += ` fill=${fill}`;
      return s;
    }

    if (tag === 'ellipse') {
      const cx = shape.getAttr('cx') ?? '0';
      const cy = shape.getAttr('cy') ?? '0';
      const rx = shape.getAttr('rx') ?? '0';
      const ry = shape.getAttr('ry') ?? '0';
      const fill = shape.getAttr('fill');
      let s = `ellipse#${id}\tcx=${cx} cy=${cy} rx=${rx} ry=${ry}`;
      if (fill) s += ` fill=${fill}`;
      return s;
    }

    if (tag === 'line') {
      const x1 = shape.getAttr('x1') ?? '0';
      const y1 = shape.getAttr('y1') ?? '0';
      const x2 = shape.getAttr('x2') ?? '0';
      const y2 = shape.getAttr('y2') ?? '0';
      const stroke = shape.getAttr('stroke');
      let s = `line#${id}\t(${x1},${y1}) -> (${x2},${y2})`;
      if (stroke) s += ` stroke=${stroke}`;
      return s;
    }

    if (tag === 'text') {
      const x = shape.getAttr('x') ?? '0';
      const y = shape.getAttr('y') ?? '0';
      const text = (shape as TextShape).text;
      return `text#${id}\t(${x},${y}) "${text}"`;
    }

    if (tag === 'g') {
      return `g#${id}`;
    }

    return `${tag}#${id}`;
  }

  static show(shape: Shape): string {
    const parentInfo = shape.parent ? `parent=${shape.parent.tag}#${shape.parent.id}` : 'parent=none';
    let result = `${shape.tag}#${shape.id}  ${parentInfo}`;

    const attrs = shape.getAllAttrs();
    const attrLines: string[] = [];
    for (const [k, v] of Object.entries(attrs)) {
      attrLines.push(`${k}=${v}`);
    }

    if (shape instanceof TextShape) {
      attrLines.push(`text="${shape.text}"`);
    }

    if (attrLines.length > 0) {
      result += '\n  ' + attrLines.join(' ');
    }

    return result;
  }

  static help(): string {
    return [
      'Commands:',
      '  init [w] [h]              - create new canvas (default 800x600)',
      '  read <file.svg>           - read SVG file',
      '  save [file.svg]           - save current document',
      '  canvas [w] [h]            - show or set canvas size',
      '  create <type> <id> [params...] [in <containerId>]',
      '                            - create shape (rect/circle/ellipse/line/text/g)',
      '  delete <id>               - delete shape',
      '  move <id> <dx> <dy>       - move shape',
      '  scale <id> <factor>       - scale shape',
      '  set <id> <attr> <value>   - set attribute',
      '  group <newGid> <id1> <id2>...',
      '                            - group shapes',
      '  ungroup <gid>             - ungroup container',
      '  addto <gid> <id>          - add shape to container',
      '  front <id>                - move to front',
      '  back <id>                 - move to back',
      '  tree [id]                 - show structure tree',
      '  show <id>                 - show shape details',
      '  undo                      - undo last edit',
      '  redo                      - redo last undone',
      '  help                      - show this help',
    ].join('\n');
  }
}