import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer } from '../core';

export class MoveCommand implements Command {
  private oldPositions: Map<string, { x: number; y: number }> = new Map();

  constructor(
    private doc: SVGDocument,
    private id: string,
    private dx: number,
    private dy: number
  ) {}

  execute(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    this.oldPositions.clear();
    this.moveShape(shape, this.dx, this.dy);

    const moved = this.doc.findShape(this.id);
    if (!moved) return `error: no such shape: ${this.id}`;

    const pos = this.getPosition(moved);
    if (pos) {
      return `${moved.tag}#${this.id} moved to (${pos.x},${pos.y})`;
    }
    return `${moved.tag}#${this.id} moved by (${this.dx},${this.dy})`;
  }

  undo(): string {
    for (const [sid, oldPos] of this.oldPositions) {
      const shape = this.doc.findShape(sid);
      if (!shape) continue;
      this.setPosition(shape, oldPos.x, oldPos.y);
    }
    const shape = this.doc.findShape(this.id);
    if (!shape) return `error: no such shape: ${this.id}`;
    const pos = this.getPosition(shape);
    if (pos) {
      return `${shape.tag}#${this.id} moved back to (${pos.x},${pos.y})`;
    }
    return `${shape.tag}#${this.id} moved back by (${-this.dx},${-this.dy})`;
  }

  private moveShape(shape: Shape, dx: number, dy: number): void {
    const pos = this.getPosition(shape);
    if (pos) {
      this.oldPositions.set(shape.id, { ...pos });
      this.setPosition(shape, pos.x + dx, pos.y + dy);
    }

    if ('children' in shape) {
      for (const c of (shape as ShapeContainer).children) {
        this.moveShape(c, dx, dy);
      }
    }
  }

  private getPosition(shape: Shape): { x: number; y: number } | null {
    const tag = shape.tag;
    if (tag === 'rect') {
      const x = parseFloat(shape.getAttr('x') ?? '0');
      const y = parseFloat(shape.getAttr('y') ?? '0');
      return { x, y };
    }
    if (tag === 'circle') {
      const x = parseFloat(shape.getAttr('cx') ?? '0');
      const y = parseFloat(shape.getAttr('cy') ?? '0');
      return { x, y };
    }
    if (tag === 'ellipse') {
      const x = parseFloat(shape.getAttr('cx') ?? '0');
      const y = parseFloat(shape.getAttr('cy') ?? '0');
      return { x, y };
    }
    if (tag === 'line') {
      const x1 = parseFloat(shape.getAttr('x1') ?? '0');
      const y1 = parseFloat(shape.getAttr('y1') ?? '0');
      return { x: x1, y: y1 };
    }
    if (tag === 'text') {
      const x = parseFloat(shape.getAttr('x') ?? '0');
      const y = parseFloat(shape.getAttr('y') ?? '0');
      return { x, y };
    }
    return null;
  }

  private setPosition(shape: Shape, x: number, y: number): void {
    const tag = shape.tag;
    if (tag === 'rect') {
      shape.setAttr('x', String(x));
      shape.setAttr('y', String(y));
    } else if (tag === 'circle' || tag === 'ellipse') {
      shape.setAttr('cx', String(x));
      shape.setAttr('cy', String(y));
    } else if (tag === 'line') {
      const oldX1 = this.oldPositions.get(shape.id)?.x ?? 0;
      const oldY1 = this.oldPositions.get(shape.id)?.y ?? 0;
      const x2 = parseFloat(shape.getAttr('x2') ?? '0');
      const y2 = parseFloat(shape.getAttr('y2') ?? '0');
      const dx = x - oldX1;
      const dy = y - oldY1;
      shape.setAttr('x1', String(x));
      shape.setAttr('y1', String(y));
      shape.setAttr('x2', String(x2 + dx));
      shape.setAttr('y2', String(y2 + dy));
    } else if (tag === 'text') {
      shape.setAttr('x', String(x));
      shape.setAttr('y', String(y));
    }
  }
}