import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer } from '../core';

export class FrontCommand implements Command {
  private oldIndex: number = -1;
  private parent: ShapeContainer | null = null;

  constructor(
    private doc: SVGDocument,
    private id: string
  ) {}

  execute(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    this.parent = shape.parent;
    if (!this.parent) {
      return `error: no parent for ${this.id}`;
    }

    this.oldIndex = this.parent.indexOf(shape);
    this.parent.removeChild(shape);
    this.parent.addChild(shape);

    return `${shape.tag}#${this.id} moved to front`;
  }

  undo(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape || !this.parent) {
      return `error: cannot undo front`;
    }

    const currentParent = shape.parent;
    if (currentParent) {
      currentParent.removeChild(shape);
    }
    this.parent.insertChildAt(shape, this.oldIndex);

    return `${shape.tag}#${this.id} moved back to position ${this.oldIndex}`;
  }
}

export class BackCommand implements Command {
  private oldIndex: number = -1;
  private parent: ShapeContainer | null = null;

  constructor(
    private doc: SVGDocument,
    private id: string
  ) {}

  execute(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    this.parent = shape.parent;
    if (!this.parent) {
      return `error: no parent for ${this.id}`;
    }

    this.oldIndex = this.parent.indexOf(shape);
    this.parent.removeChild(shape);
    this.parent.insertChildAt(shape, 0);

    return `${shape.tag}#${this.id} moved to back`;
  }

  undo(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape || !this.parent) {
      return `error: cannot undo back`;
    }

    const currentParent = shape.parent;
    if (currentParent) {
      currentParent.removeChild(shape);
    }
    this.parent.insertChildAt(shape, this.oldIndex);

    return `${shape.tag}#${this.id} moved back to position ${this.oldIndex}`;
  }
}