export interface Shape {
  readonly id: string;
  readonly tag: string;
  parent: ShapeContainer | null;

  getAttr(name: string): string | null;
  setAttr(name: string, value: string): void;
  removeAttr(name: string): void;
  getAllAttrs(): Record<string, string>;

  toXmlString(indent: string): string;
  clone(): Shape;
}

export interface ShapeContainer extends Shape {
  readonly children: readonly Shape[];
  addChild(child: Shape): void;
  removeChild(child: Shape): void;
  insertChildAt(child: Shape, index: number): void;
  indexOf(child: Shape): number;
  getChild(id: string): Shape | null;
  findShape(id: string): Shape | null;
  containsDescendant(id: string): boolean;
}