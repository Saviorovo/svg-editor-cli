import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer, GroupShape } from '../core';

export class UngroupCommand implements Command {
  private oldParent: ShapeContainer | null = null;
  private oldIndex: number = -1;
  private children: Shape[] = [];
  private childOldIndices: Map<string, number> = new Map();

  constructor(
    private doc: SVGDocument,
    private gid: string
  ) {}

  execute(): string {
    const shape = this.doc.findShape(this.gid);
    if (!shape) {
      return `error: no such shape: ${this.gid}`;
    }
    if (!(shape instanceof GroupShape)) {
      return `error: cannot ungroup composite shape: ${this.gid}`;
    }

    this.oldParent = shape.parent;
    if (this.oldParent) {
      this.oldIndex = this.oldParent.indexOf(shape);
    }

    const group = shape as GroupShape;
    this.children = [...group.children];
    this.childOldIndices.clear();

    for (let i = 0; i < this.children.length; i++) {
      this.childOldIndices.set(this.children[i].id, i);
    }

    for (const c of this.children) {
      group.removeChild(c);
    }

    if (this.oldParent) {
      this.oldParent.removeChild(group);
      for (const c of this.children) {
        this.oldParent.insertChildAt(c, this.oldIndex + this.childOldIndices.get(c.id)!);
      }
    }

    return `g#${this.gid} ungrouped`;
  }

  undo(): string {
    if (!this.oldParent) return `error: cannot undo ungroup`;

    for (const c of this.children) {
      this.oldParent.removeChild(c);
    }

    const group = new GroupShape(this.gid);
    this.oldParent.insertChildAt(group, this.oldIndex);

    for (const c of this.children) {
      group.addChild(c);
    }

    return `g#${this.gid} regrouped`;
  }
}