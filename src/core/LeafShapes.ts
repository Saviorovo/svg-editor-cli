import { BaseShape } from './BaseShape';
import { Shape } from './Shape';

export class RectShape extends BaseShape {
  constructor(id: string) {
    super(id, 'rect');
  }

  toXmlString(indent: string): string {
    return `${indent}<rect ${this.attrsToString()}/>`;
  }

  clone(): Shape {
    const s = new RectShape(this.id);
    for (const [k, v] of this.attrs) {
      s.setAttr(k, v);
    }
    return s;
  }
}

export class CircleShape extends BaseShape {
  constructor(id: string) {
    super(id, 'circle');
  }

  toXmlString(indent: string): string {
    return `${indent}<circle ${this.attrsToString()}/>`;
  }

  clone(): Shape {
    const s = new CircleShape(this.id);
    for (const [k, v] of this.attrs) {
      s.setAttr(k, v);
    }
    return s;
  }
}

export class EllipseShape extends BaseShape {
  constructor(id: string) {
    super(id, 'ellipse');
  }

  toXmlString(indent: string): string {
    return `${indent}<ellipse ${this.attrsToString()}/>`;
  }

  clone(): Shape {
    const s = new EllipseShape(this.id);
    for (const [k, v] of this.attrs) {
      s.setAttr(k, v);
    }
    return s;
  }
}

export class LineShape extends BaseShape {
  constructor(id: string) {
    super(id, 'line');
  }

  toXmlString(indent: string): string {
    return `${indent}<line ${this.attrsToString()}/>`;
  }

  clone(): Shape {
    const s = new LineShape(this.id);
    for (const [k, v] of this.attrs) {
      s.setAttr(k, v);
    }
    return s;
  }
}

export class TextShape extends BaseShape {
  private _text: string = '';

  constructor(id: string) {
    super(id, 'text');
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
  }

  toXmlString(indent: string): string {
    const attrStr = this.attrsToString();
    return `${indent}<text ${attrStr}>${this.escapeXml(this._text)}</text>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  clone(): Shape {
    const s = new TextShape(this.id);
    for (const [k, v] of this.attrs) {
      s.setAttr(k, v);
    }
    s._text = this._text;
    return s;
  }
}