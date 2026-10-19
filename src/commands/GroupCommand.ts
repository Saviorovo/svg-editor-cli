import { Command } from './Command';
import { SVGDocument, Shape, ShapeContainer, GroupShape } from '../core';

export class GroupCommand implements Command {
  private group: GroupShape | null = null;
  private oldParents: Map<string, { parent: ShapeContainer; index: number }> = new Map();

  constructor(
    private doc: SVGDocument,
    private newGid: string,
    private memberIds: string[]
  ) {}

  execute(): string {
    if (this.doc.findShape(this.newGid)) {
      return `error: id already exists: ${this.newGid}`;
    }

    const members: Shape[] = [];
    for (const mid of this.memberIds) {
      const shape = this.doc.findShape(mid);
      if (!shape) {
        return `error: no such shape: ${mid}`;
      }
      members.push(shape);
    }

    for (const m of members) {
      if (m.id === this.newGid) continue;
      for (const other of members) {
        if (m === other) continue;
        if ('containsDescendant' in m) {
          if ((m as ShapeContainer).containsDescendant(other.id)) {
            return `error: cannot group a container into its own descendant: ${m.id}`;
          }
        }
      }
    }

    this.oldParents.clear();
    for (const m of members) {
      const parent = m.parent;
      if (parent) {
        this.oldParents.set(m.id, { parent, index: parent.indexOf(m) });
      }
    }

    const group = new GroupShape(this.newGid);
    const firstParent = members[0].parent ?? this.doc;
    firstParent.addChild(group);

    for (const m of members) {
      group.addChild(m);
    }

    this.group = group;
    return `g#${this.newGid} created with ${members.length} children`;
  }

  undo(): string {
    if (!this.group) return `error: group not created`;

    const children = [...this.group.children];
    for (const c of children) {
      this.group.removeChild(c);
      const info = this.oldParents.get(c.id);
      if (info) {
        info.parent.insertChildAt(c, info.index);
      }
    }

    const parent = this.group.parent;
    if (parent) {
      parent.removeChild(this.group);
    }

    return `g#${this.newGid} ungrouped`;
  }
}