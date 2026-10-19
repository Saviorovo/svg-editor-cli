import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer } from '../core';

export class AddToCommand implements Command {
  private oldParent: ShapeContainer | null = null;
  private oldIndex: number = -1;

  constructor(
    private doc: SVGDocument,
    private gid: string,
    private id: string
  ) {}

  execute(): string {
    const container = this.doc.findShape(this.gid);
    if (!container) {
      return `error: no such container: ${this.gid}`;
    }
    if (!('children' in container)) {
      return `error: not a container: ${this.gid}`;
    }

    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    this.oldParent = shape.parent;
    if (this.oldParent) {
      this.oldIndex = this.oldParent.indexOf(shape);
    }

    (container as ShapeContainer).addChild(shape);
    return `${shape.tag}#${this.id} added to g#${this.gid}`;
  }

  undo(): string {
    const shape = this.doc.findShape(this.id);
    if (!shape) {
      return `error: no such shape: ${this.id}`;
    }

    const currentParent = shape.parent;
    if (currentParent) {
      currentParent.removeChild(shape);
    }

    if (this.oldParent) {
      this.oldParent.insertChildAt(shape, this.oldIndex);
    }

    return `${shape.tag}#${this.id} moved back`;
  }
}