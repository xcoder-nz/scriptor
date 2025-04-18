import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function main() {
  void yargs(hideBin(process.argv)).argv;
  console.log('Hello, world!');
}

