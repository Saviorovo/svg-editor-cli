import * as readline from 'readline';
import { CommandParser } from './CommandParser';
import { CommandDispatcher } from './CommandDispatcher';

const dispatcher = new CommandDispatcher();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'svg> ',
});

console.log("svg-editor 0.1 — type 'help' for commands\n");
rl.prompt();

rl.on('line', (line: string) => {
  const parsed = CommandParser.parse(line);
  if (parsed) {
    try {
      const result = dispatcher.dispatch(parsed.name, parsed.args);
      console.log(result);
    } catch (e: any) {
      console.log(`error: ${e.message}`);
    }
  }
  rl.prompt();
});

rl.on('close', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});