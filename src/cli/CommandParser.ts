export interface ParsedCommand {
  name: string;
  args: string[];
}

export class CommandParser {
  static parse(line: string): ParsedCommand | null {
    line = line.trim();
    if (line.length === 0 || line.startsWith('#')) {
      return null;
    }

    const tokens = this.tokenize(line);
    if (tokens.length === 0) return null;

    return {
      name: tokens[0],
      args: tokens.slice(1),
    };
  }

  private static tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (!inQuote && (ch === '"' || ch === "'")) {
        inQuote = true;
        quoteChar = ch;
        continue;
      }

      if (inQuote && ch === quoteChar) {
        inQuote = false;
        quoteChar = '';
        tokens.push(current);
        current = '';
        continue;
      }

      if (!inQuote && /\s/.test(ch)) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += ch;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }
}