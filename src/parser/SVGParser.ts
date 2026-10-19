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
    const regex = /<(rect|circle|ellipse|line|text|g)\b([^>]*)>(?:([^<]*)<\/\1>)?/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(xml)) !== null) {
      const tag = match[1];
      const attrStr = match[2];
      const textContent = match[3];

      let id = this.extractAttr(attrStr, 'id');
      if (!id) {
        const count = (this.autoIdCounter.get(tag) ?? 0) + 1;
        this.autoIdCounter.set(tag, count);
        id = `${tag}${count}`;
        this.warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      }

      if (tag === 'g') {
        const group = new GroupShape(id);
        const innerStart = match.index + match[0].length;
        const innerEnd = this.findClosingTag(xml, match.index, tag);
        const inner = xml.slice(innerStart, innerEnd);
        const nested = this.parseChildren(inner);
        for (const c of nested) {
          group.addChild(c);
        }
        children.push(group);
      } else {
        const shape = this.createShape(tag, id, attrStr, textContent);
        if (shape) {
          children.push(shape);
        }
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
      shape.text = this.unescapeXml(textContent.trim());
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
      const openMatch = xml.slice(i).match(new RegExp(`<${tag}\\b`));
      const closeMatch = xml.slice(i).match(new RegExp(`</${tag}>`));

      const openPos = openMatch ? i + openMatch.index! : Infinity;
      const closePos = closeMatch ? i + closeMatch.index! : Infinity;

      if (closePos < openPos) {
        depth--;
        i = closePos + `</${tag}>`.length;
      } else if (openPos < closePos) {
        depth++;
        i = openPos + `<${tag}`.length;
      } else {
        break;
      }
    }
    return i;
  }

  private unescapeXml(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}