import { Shape, ShapeContainer, TextShape } from '../core';
import { GroupShape, RectShape, CircleShape, EllipseShape, LineShape } from '../core';

export class SVGParser {
  private autoIdCounter: Map<string, number> = new Map();
  private warnings: string[] = [];

  parse(xml: string): { width: number; height: number; children: Shape[]; warnings: string[] } {
    this.autoIdCounter.clear();
    this.warnings = [];

    const svgMatch = xml.match(/<svg[^>]*>/);
    if (!svgMatch) {
      throw new Error('invalid SVG: no <svg> root');
    }

    const width = this.extractAttr(svgMatch[0], 'width') ?? '800';
    const height = this.extractAttr(svgMatch[0], 'height') ?? '600';

    const body = xml.slice(xml.indexOf('>') + 1).replace(/<\/svg>\s*$/, '');
    const children = this.parseChildren(body);

    return {
      width: parseFloat(width),
      height: parseFloat(height),
      children,
      warnings: this.warnings,
    };
  }

  private parseChildren(xml: string): Shape[] {
    const children: Shape[] = [];
    let i = 0;

    while (i < xml.length) {
      const tagStart = xml.indexOf('<', i);
      if (tagStart < 0) break;

      if (xml[tagStart + 1] === '/') {
        i = tagStart + 1;
        continue;
      }

      const tagEnd = xml.indexOf('>', tagStart);
      if (tagEnd < 0) break;

      const openTag = xml.slice(tagStart, tagEnd + 1);
      const tagMatch = openTag.match(/^<(\w+)/);
      if (!tagMatch) {
        i = tagEnd + 1;
        continue;
      }

      const tag = tagMatch[1];
      if (!['rect', 'circle', 'ellipse', 'line', 'text', 'g'].includes(tag)) {
        i = tagEnd + 1;
        continue;
      }

      const attrStr = openTag.slice(tag.length + 1).replace(/>$/, '');
      let id = this.extractAttr(attrStr, 'id');
      if (!id) {
        const count = (this.autoIdCounter.get(tag) ?? 0) + 1;
        this.autoIdCounter.set(tag, count);
        id = `${tag}${count}`;
        this.warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      }

      if (tag === 'g') {
        const closeStart = this.findClosingTag(xml, tagStart, tag);
        const inner = xml.slice(tagEnd + 1, closeStart);
        const group = new GroupShape(id);
        const nested = this.parseChildren(inner);
        for (const c of nested) {
          group.addChild(c);
        }
        children.push(group);
        i = closeStart + `</${tag}>`.length;
      } else if (tag === 'text') {
        const closeStart = xml.indexOf(`</${tag}>`, tagEnd);
        let textContent = '';
        if (closeStart >= 0) {
          textContent = xml.slice(tagEnd + 1, closeStart).trim();
          i = closeStart + `</${tag}>`.length;
        } else {
          i = tagEnd + 1;
        }
        const shape = this.createShape(tag, id, attrStr, textContent);
        if (shape) children.push(shape);
      } else {
        const shape = this.createShape(tag, id, attrStr);
        if (shape) children.push(shape);
        i = tagEnd + 1;
      }
    }

    return children;
  }

  private createShape(tag: string, id: string, attrStr: string, textContent?: string): Shape | null {
    let shape: Shape;
    switch (tag) {
      case 'rect': shape = new RectShape(id); break;
      case 'circle': shape = new CircleShape(id); break;
      case 'ellipse': shape = new EllipseShape(id); break;
      case 'line': shape = new LineShape(id); break;
      case 'text': shape = new TextShape(id); break;
      default: return null;
    }

    const attrs = this.parseAttrs(attrStr);
    for (const [k, v] of Object.entries(attrs)) {
      if (k !== 'id') {
        shape.setAttr(k, v);
      }
    }

    if (shape instanceof TextShape && textContent !== undefined) {
      shape.text = this.unescapeXml(textContent);
    }

    return shape;
  }

  private parseAttrs(attrStr: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /([a-zA-Z][-\w]*)=(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(attrStr)) !== null) {
      attrs[match[1]] = match[2] ?? match[3];
    }
    return attrs;
  }

  private extractAttr(attrStr: string, name: string): string | null {
    const regex = new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`);
    const match = attrStr.match(regex);
    return match?.[1] ?? match?.[2] ?? null;
  }

  private findClosingTag(xml: string, openIndex: number, tag: string): number {
    let depth = 1;
    let i = openIndex + 1;
    while (i < xml.length && depth > 0) {
      const nextOpen = xml.indexOf(`<${tag}`, i);
      const nextClose = xml.indexOf(`</${tag}>`, i);

      if (nextClose < 0) break;
      if (nextOpen >= 0 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + `<${tag}`.length;
      } else {
        depth--;
        if (depth === 0) return nextClose;
        i = nextClose + `</${tag}>`.length;
      }
    }
    return xml.length;
  }

  private unescapeXml(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}