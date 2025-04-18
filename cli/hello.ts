#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .command(
    '*',
    'Default command',
    () => {},
    (argv) => {
      console.log('Hello, Scriptor!');
    }
  )
  .help()
  .parse();