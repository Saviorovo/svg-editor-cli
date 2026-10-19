import { Command } from './Command';

export class CommandInvoker {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private _ioLocked: boolean = false;

  get ioLocked(): boolean {
    return this._ioLocked;
  }

  lockIo(): void {
    this._ioLocked = true;
  }

  unlockIo(): void {
    this._ioLocked = false;
  }

  execute(cmd: Command): string {
    const result = cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
    return result;
  }

  undo(): string {
    if (this._ioLocked) {
      return 'error: undo not allowed after io command';
    }
    if (this.undoStack.length === 0) {
      return 'error: nothing to undo';
    }
    const cmd = this.undoStack.pop()!;
    const result = cmd.undo();
    this.redoStack.push(cmd);
    return result;
  }

  redo(): string {
    if (this._ioLocked) {
      return 'error: redo not allowed after io command';
    }
    if (this.redoStack.length === 0) {
      return 'error: nothing to redo';
    }
    const cmd = this.redoStack.pop()!;
    const result = cmd.execute();
    this.undoStack.push(cmd);
    return result;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this._ioLocked = false;
  }
}