import { BaseShape } from './BaseShape';
import { Shape, ShapeContainer } from './Shape';

export class GroupShape extends BaseShape implements ShapeContainer {
  private _children: Shape[] = [];

  constructor(id: string) {
    super(id, 'g');
  }

  get children(): readonly Shape[] {
    return this._children;
  }

  addChild(child: Shape): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    this._children.push(child);
    child.parent = this;
  }

  removeChild(child: Shape): void {
    const idx = this._children.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      child.parent = null;
    }
  }

  insertChildAt(child: Shape, index: number): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    this._children.splice(index, 0, child);
    child.parent = this;
  }

  indexOf(child: Shape): number {
    return this._children.indexOf(child);
  }

  getChild(id: string): Shape | null {
    for (const c of this._children) {
      if (c.id === id) return c;
    }
    return null;
  }

  findShape(id: string): Shape | null {
    if (this.id === id) return this;
    for (const c of this._children) {
      if (c.id === id) return c;
      if ('findShape' in c) {
        const found = (c as ShapeContainer).findShape(id);
        if (found) return found;
      }
    }
    return null;
  }

  containsDescendant(id: string): boolean {
    for (const c of this._children) {
      if (c.id === id) return true;
      if ('containsDescendant' in c) {
        if ((c as ShapeContainer).containsDescendant(id)) return true;
      }
    }
    return false;
  }

  toXmlString(indent: string): string {
    const attrStr = this.attrsToString();
    if (this._children.length === 0) {
      return `${indent}<g ${attrStr}/>`;
    }
    let result = `${indent}<g ${attrStr}>`;
    for (const c of this._children) {
      result += '\n' + c.toXmlString(indent + '  ');
    }
    result += '\n' + indent + '</g>';
    return result;
  }

  clone(): ShapeContainer {
    const g = new GroupShape(this.id);
    for (const [k, v] of this.attrs) {
      g.setAttr(k, v);
    }
    for (const c of this._children) {
      g.addChild(c.clone());
    }
    return g;
  }
}