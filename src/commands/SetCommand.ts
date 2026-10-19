import { Command } from './Command';
    import { SVGDocument, Shape, TextShape } from '../core';

    const VALID_ATTRS: Record<string, string[]> = {
      rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width'],
      circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
      ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
      line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
      text: ['x', 'y', 'fill', 'stroke', 'stroke-width', 'text'],
      g: ['fill', 'stroke', 'stroke-width'],
    };

    export class SetCommand implements Command {
      private oldValue: string | null = null;
      private wasText: boolean = false;

      constructor(
        private doc: SVGDocument,
        private id: string,
        private attr: string,
        private value: string
      ) {}

      execute(): string {
        const shape = this.doc.findShape(this.id);
        if (!shape) {
          return `error: no such shape: ${this.id}`;
        }

        const valid = VALID_ATTRS[shape.tag] ?? [];
        if (!valid.includes(this.attr)) {
          return `error: unknown attribute: ${this.attr}`;
        }

        if (shape instanceof TextShape && this.attr === 'text') {
          this.wasText = true;
          this.oldValue = shape.text;
          shape.text = this.value;
          return `text#${this.id} updated: text="${this.value}"`;
        }

        this.oldValue = shape.getAttr(this.attr);
        shape.setAttr(this.attr, this.value);
        return `${shape.tag}#${this.id} updated: ${this.attr}=${this.value}`;
      }

      undo(): string {
        const shape = this.doc.findShape(this.id);
        if (!shape) {
          return `error: no such shape: ${this.id}`;
        }

        if (this.wasText && shape instanceof TextShape) {
          shape.text = this.oldValue ?? '';
          return `text#${this.id} restored: text="${shape.text}"`;
        }

        if (this.oldValue === null) {
          shape.removeAttr(this.attr);
        } else {
          shape.setAttr(this.attr, this.oldValue);
        }
        return `${shape.tag}#${this.id} restored: ${this.attr}=${this.oldValue ?? '(removed)'}`;
      }
    }