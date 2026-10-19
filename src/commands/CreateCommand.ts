import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer, TextShape } from '../core';
import { ShapeFactory } from '../core';

export class CreateCommand implements Command {
  private createdShape: Shape | null = null;

  constructor(
    private doc: SVGDocument,
    private type: string,
    private id: string,
    private attrs: Record<string, string>,
    private textContent: string | null,
    private containerId: string | null
  ) {}

  execute(): string {
    if (this.doc.findShape(this.id)) {
      return `error: id already exists: ${this.id}`;
    }

    let container: ShapeContainer = this.doc;
    if (this.containerId) {
      const c = this.doc.findShape(this.containerId);
      if (!c) {
        return `error: no such container: ${this.containerId}`;
      }
      if (!('children' in c)) {
        return `error: not a container: ${this.containerId}`;
      }
      container = c as ShapeContainer;
    }

    const shape = ShapeFactory.create(this.type, this.id);
    for (const [k, v] of Object.entries(this.attrs)) {
      shape.setAttr(k, v);
    }
    if (this.textContent !== null && shape instanceof TextShape) {
      shape.text = this.textContent;
    }

    container.addChild(shape);
    this.createdShape = shape;

    if (this.containerId) {
      return `${this.type}#${this.id} created in ${container.tag}#${this.containerId}`;
    }
    return `${this.type}#${this.id} created`;
  }

  undo(): string {
    if (this.createdShape) {
      const parent = this.createdShape.parent;
      if (parent) {
        parent.removeChild(this.createdShape);
      }
    }
    return `${this.type}#${this.id} deleted`;
  }
}