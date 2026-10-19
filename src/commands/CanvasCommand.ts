import { Command } from './Command';
import { SVGDocument } from '../core';

export class CanvasCommand implements Command {
  private oldWidth: number;
  private oldHeight: number;

  constructor(
    private doc: SVGDocument,
    private newWidth: number | null,
    private newHeight: number | null
  ) {
    this.oldWidth = doc.width;
    this.oldHeight = doc.height;
  }

  execute(): string {
    if (this.newWidth !== null) {
      this.doc.width = this.newWidth;
    }
    if (this.newHeight !== null) {
      this.doc.height = this.newHeight;
    }
    return `canvas ${this.doc.width}x${this.doc.height}`;
  }

  undo(): string {
    this.doc.width = this.oldWidth;
    this.doc.height = this.oldHeight;
    return `canvas restored to ${this.doc.width}x${this.doc.height}`;
  }
}