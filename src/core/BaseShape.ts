import { Shape, ShapeContainer } from './Shape';

export abstract class BaseShape implements Shape {
  private _parent: ShapeContainer | null = null;
  protected attrs: Map<string, string> = new Map();

  constructor(
    public readonly id: string,
    public readonly tag: string
  ) {}

  get parent(): ShapeContainer | null {
    return this._parent;
  }

  set parent(p: ShapeContainer | null) {
    this._parent = p;
  }

  getAttr(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }

  setAttr(name: string, value: string): void {
    this.attrs.set(name, value);
  }

  removeAttr(name: string): void {
    this.attrs.delete(name);
  }

  getAllAttrs(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.attrs) {
      result[k] = v;
    }
    return result;
  }

  abstract toXmlString(indent: string): string;
  abstract clone(): Shape;

  protected attrsToString(): string {
    const parts: string[] = [`id="${this.id}"`];
    for (const [k, v] of this.attrs) {
      parts.push(`${k}="${v}"`);
    }
    return parts.join(' ');
  }
}