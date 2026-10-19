import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer } from '../core';

export class ScaleCommand implements Command {
  private oldValues: Map<string, Record<string, string>> = new Map();

  constructor(
    private doc: SVGDocument,
    private id: string,
    private factor: number
  ) {}

  execute(): string {
    if (this.factor <= 0) {
      return 'error: scale factor must be positive';
    }

    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    this.oldValues.clear();
    this.scaleShape(shape, this.factor);

    return `${shape.tag}#${this.id} scaled by ${this.factor}`;
  }

  undo(): string {
    for (const [sid, attrs] of this.oldValues) {
      const shape = this.doc.findShape(sid);
      if (!shape) continue;
      for (const [k, v] of Object.entries(attrs)) {
        shape.setAttr(k, v);
      }
    }
    const shape = this.doc.findShape(this.id);
    if (!shape) return `error: no such shape: ${this.id}`;
    return `${shape.tag}#${this.id} scale restored`;
  }

  private scaleShape(shape: Shape, factor: number): void {
    const tag = shape.tag;
    const oldAttrs: Record<string, string> = {};

    const scaleAttr = (name: string) => {
      const val = shape.getAttr(name);
      if (val !== null) {
        oldAttrs[name] = val;
        shape.setAttr(name, String(parseFloat(val) * factor));
      }
    };

    if (tag === 'rect') {
      scaleAttr('x');
      scaleAttr('y');
      scaleAttr('width');
      scaleAttr('height');
    } else if (tag === 'circle') {
      scaleAttr('cx');
      scaleAttr('cy');
      scaleAttr('r');
    } else if (tag === 'ellipse') {
      scaleAttr('cx');
      scaleAttr('cy');
      scaleAttr('rx');
      scaleAttr('ry');
    } else if (tag === 'line') {
      scaleAttr('x1');
      scaleAttr('y1');
      scaleAttr('x2');
      scaleAttr('y2');
    } else if (tag === 'text') {
      scaleAttr('x');
      scaleAttr('y');
    }

    if (Object.keys(oldAttrs).length > 0) {
      this.oldValues.set(shape.id, oldAttrs);
    }

    if ('children' in shape) {
      for (const c of (shape as ShapeContainer).children) {
        this.scaleShape(c, factor);
      }
    }
  }
}