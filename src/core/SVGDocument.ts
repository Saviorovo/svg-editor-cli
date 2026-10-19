import { Shape, ShapeContainer } from './Shape';
import { GroupShape } from './GroupShape';

export class SVGDocument implements ShapeContainer {
  private _children: Shape[] = [];
  private _width: number = 800;
  private _height: number = 600;
  private _filePath: string | null = null;

  get id(): string { return 'svg'; }
  get tag(): string { return 'svg'; }
  get parent(): null { return null; }
  set parent(_: null) {}

  get width(): number { return this._width; }
  set width(v: number) { this._width = v; }

  get height(): number { return this._height; }
  set height(v: number) { this._height = v; }

  get filePath(): string | null { return this._filePath; }
  set filePath(v: string | null) { this._filePath = v; }

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
    if (id === 'svg') return this;
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

  getAttr(name: string): string | null {
    if (name === 'width') return String(this._width);
    if (name === 'height') return String(this._height);
    return null;
  }

  setAttr(name: string, value: string): void {
    if (name === 'width') this._width = parseFloat(value);
    if (name === 'height') this._height = parseFloat(value);
  }

  removeAttr(_name: string): void {}

  getAllAttrs(): Record<string, string> {
    return { width: String(this._width), height: String(this._height) };
  }

  toXmlString(indent: string): string {
    const w = this._width;
    const h = this._height;
    let result = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    result += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    for (const c of this._children) {
      result += '\n' + c.toXmlString('  ');
    }
    result += '\n</svg>';
    return result;
  }

  clone(): ShapeContainer {
    const doc = new SVGDocument();
    doc._width = this._width;
    doc._height = this._height;
    doc._filePath = this._filePath;
    for (const c of this._children) {
      doc.addChild(c.clone());
    }
    return doc;
  }

  countElements(): number {
    let count = 0;
    for (const c of this._children) {
      count++;
      if ('children' in c) {
        count += this.countContainerElements(c as ShapeContainer);
      }
    }
    return count;
  }

  private countContainerElements(container: ShapeContainer): number {
    let count = 0;
    for (const c of container.children) {
      count++;
      if ('children' in c) {
        count += this.countContainerElements(c as ShapeContainer);
      }
    }
    return count;
  }
}