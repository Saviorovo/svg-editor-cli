import * as fs from 'fs';
import { SVGDocument, Shape, ShapeContainer, TextShape, ShapeFactory } from '../core';
import {
  Command,
  CommandInvoker,
  CreateCommand,
  DeleteCommand,
  MoveCommand,
  ScaleCommand,
  SetCommand,
  GroupCommand,
  UngroupCommand,
  AddToCommand,
  FrontCommand,
  BackCommand,
  CanvasCommand,
} from '../commands';
import { SVGParser } from '../parser';
import { DisplayUtil } from './DisplayUtil';

export class CommandDispatcher {
  private doc: SVGDocument | null = null;
  private invoker = new CommandInvoker();

  dispatch(name: string, args: string[]): string {
    if (!this.doc && !['init', 'read', 'help'].includes(name)) {
      return "error: no document. use 'init' or 'read' first";
    }

    switch (name) {
      case 'init': return this.handleInit(args);
      case 'read': return this.handleRead(args);
      case 'save': return this.handleSave(args);
      case 'canvas': return this.handleCanvas(args);
      case 'create': return this.handleCreate(args);
      case 'delete': return this.handleDelete(args);
      case 'move': return this.handleMove(args);
      case 'scale': return this.handleScale(args);
      case 'set': return this.handleSet(args);
      case 'group': return this.handleGroup(args);
      case 'ungroup': return this.handleUngroup(args);
      case 'addto': return this.handleAddTo(args);
      case 'front': return this.handleFront(args);
      case 'back': return this.handleBack(args);
      case 'tree': return this.handleTree(args);
      case 'show': return this.handleShow(args);
      case 'undo': return this.invoker.undo();
      case 'redo': return this.invoker.redo();
      case 'help': return DisplayUtil.help();
      default:
        return `error: unknown command: ${name}`;
    }
  }

  private handleInit(args: string[]): string {
    const w = args[0] ? parseFloat(args[0]) : 800;
    const h = args[1] ? parseFloat(args[1]) : 600;
    this.doc = new SVGDocument();
    this.doc.width = w;
    this.doc.height = h;
    this.invoker.clear();
    return `canvas ${w}x${h} created`;
  }

  private handleRead(args: string[]): string {
    if (args.length < 1) {
      return 'error: read requires a file path';
    }
    const path = args[0];
    try {
      const xml = fs.readFileSync(path, 'utf-8');
      const parser = new SVGParser();
      const result = parser.parse(xml);

      this.doc = new SVGDocument();
      this.doc.width = result.width;
      this.doc.height = result.height;
      this.doc.filePath = path;
      for (const c of result.children) {
        this.doc.addChild(c);
      }
      this.invoker.clear();

      let output = '';
      for (const w of result.warnings) {
        output += w + '\n';
      }
      output += `read ${path} (${this.doc.countElements()} elements)`;
      return output.trim();
    } catch (e: any) {
      return `error: cannot read file: ${path}`;
    }
  }

  private handleSave(args: string[]): string {
    if (!this.doc) return 'error: no document';
    const path = args[0] ?? this.doc.filePath;
    if (!path) {
      return 'error: save requires a file path';
    }
    try {
      const xml = this.doc.toXmlString('');
      fs.writeFileSync(path, xml, 'utf-8');
      this.doc.filePath = path;
      this.invoker.lockIo();
      return `saved to ${path} (${this.doc.countElements()} elements)`;
    } catch (e: any) {
      return `error: cannot write file: ${path}`;
    }
  }

  private handleCanvas(args: string[]): string {
    if (!this.doc) return 'error: no document';
    if (args.length === 0) {
      return `canvas ${this.doc.width}x${this.doc.height}`;
    }
    const w = parseFloat(args[0]);
    const h = args[1] ? parseFloat(args[1]) : this.doc.height;
    const cmd = new CanvasCommand(this.doc, w, h);
    return this.invoker.execute(cmd);
  }

  private handleCreate(args: string[]): string {
    if (!this.doc || args.length < 2) {
      return 'error: create requires type and id';
    }

    const type = args[0];
    if (!ShapeFactory.isValidType(type)) {
      return `error: unknown shape type: ${type}`;
    }

    const id = args[1];
    let containerId: string | null = null;
    const inIndex = args.indexOf('in');
    if (inIndex >= 0 && inIndex < args.length - 1) {
      containerId = args[inIndex + 1];
    }

    const paramEnd = inIndex >= 0 ? inIndex : args.length;
    const params = args.slice(2, paramEnd);

    const attrs: Record<string, string> = {};
    let textContent: string | null = null;

    if (type === 'rect' && params.length >= 4) {
      attrs.x = params[0];
      attrs.y = params[1];
      attrs.width = params[2];
      attrs.height = params[3];
      if (params[4]) attrs.fill = params[4];
    } else if (type === 'circle' && params.length >= 3) {
      attrs.cx = params[0];
      attrs.cy = params[1];
      attrs.r = params[2];
      if (params[3]) attrs.fill = params[3];
    } else if (type === 'ellipse' && params.length >= 4) {
      attrs.cx = params[0];
      attrs.cy = params[1];
      attrs.rx = params[2];
      attrs.ry = params[3];
      if (params[4]) attrs.fill = params[4];
    } else if (type === 'line' && params.length >= 4) {
      attrs.x1 = params[0];
      attrs.y1 = params[1];
      attrs.x2 = params[2];
      attrs.y2 = params[3];
      if (params[4]) attrs.stroke = params[4];
    } else if (type === 'text' && params.length >= 2) {
      attrs.x = params[0];
      attrs.y = params[1];
      if (params[2]) textContent = params[2];
    } else if (type === 'g') {
      // no params
    }

    const cmd = new CreateCommand(this.doc, type, id, attrs, textContent, containerId);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleDelete(args: string[]): string {
    if (!this.doc || args.length < 1) {
      return 'error: delete requires id';
    }
    const cmd = new DeleteCommand(this.doc, args[0]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleMove(args: string[]): string {
    if (!this.doc || args.length < 3) {
      return 'error: move requires id, dx, dy';
    }
    const cmd = new MoveCommand(this.doc, args[0], parseFloat(args[1]), parseFloat(args[2]));
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleScale(args: string[]): string {
    if (!this.doc || args.length < 2) {
      return 'error: scale requires id and factor';
    }
    const cmd = new ScaleCommand(this.doc, args[0], parseFloat(args[1]));
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleSet(args: string[]): string {
    if (!this.doc || args.length < 3) {
      return 'error: set requires id, attr, value';
    }
    const cmd = new SetCommand(this.doc, args[0], args[1], args[2]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleGroup(args: string[]): string {
    if (!this.doc || args.length < 2) {
      return 'error: group requires newGid and at least one member';
    }
    const cmd = new GroupCommand(this.doc, args[0], args.slice(1));
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleUngroup(args: string[]): string {
    if (!this.doc || args.length < 1) {
      return 'error: ungroup requires gid';
    }
    const cmd = new UngroupCommand(this.doc, args[0]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleAddTo(args: string[]): string {
    if (!this.doc || args.length < 2) {
      return 'error: addto requires gid and id';
    }
    const cmd = new AddToCommand(this.doc, args[0], args[1]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleFront(args: string[]): string {
    if (!this.doc || args.length < 1) {
      return 'error: front requires id';
    }
    const cmd = new FrontCommand(this.doc, args[0]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleBack(args: string[]): string {
    if (!this.doc || args.length < 1) {
      return 'error: back requires id';
    }
    const cmd = new BackCommand(this.doc, args[0]);
    const result = this.invoker.execute(cmd);
    this.invoker.unlockIo();
    return result;
  }

  private handleTree(args: string[]): string {
    if (!this.doc) return 'error: no document';
    return DisplayUtil.tree(this.doc, args[0]);
  }

  private handleShow(args: string[]): string {
    if (!this.doc || args.length < 1) {
      return 'error: show requires id';
    }
    const shape = this.doc.findShape(args[0]);
    if (!shape) {
      return `error: no such shape: ${args[0]}`;
    }
    return DisplayUtil.show(shape);
  }
}