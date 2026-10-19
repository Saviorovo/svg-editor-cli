import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer } from '../core';

export class DeleteCommand implements Command {
  private deletedShape: Shape | null = null;
  private parent: ShapeContainer | null = null;
  private index: number = -1;

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
    if (this.parent) {
      this.index = this.parent.indexOf(shape);
      this.parent.removeChild(shape);
    }
    this.deletedShape = shape;

    return `${shape.tag}#${this.id} deleted`;
  }

  undo(): string {
    if (this.deletedShape && this.parent) {
      this.parent.insertChildAt(this.deletedShape, this.index);
    }
    return `${this.deletedShape?.tag ?? this.id}#${this.id} restored into ${this.parent?.tag ?? 'svg'}#${this.parent?.id ?? 'svg'}`;
  }
}