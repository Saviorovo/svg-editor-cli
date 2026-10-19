import { Shape } from './Shape';
import { RectShape, CircleShape, EllipseShape, LineShape, TextShape } from './LeafShapes';
import { GroupShape } from './GroupShape';

export class ShapeFactory {
  static create(type: string, id: string): Shape {
    switch (type) {
      case 'rect': return new RectShape(id);
      case 'circle': return new CircleShape(id);
      case 'ellipse': return new EllipseShape(id);
      case 'line': return new LineShape(id);
      case 'text': return new TextShape(id);
      case 'g': return new GroupShape(id);
      default:
        throw new Error(`unknown shape type: ${type}`);
    }
  }

  static isValidType(type: string): boolean {
    return ['rect', 'circle', 'ellipse', 'line', 'text', 'g'].includes(type);
  }
}