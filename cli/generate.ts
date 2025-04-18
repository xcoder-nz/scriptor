import dotenv from 'dotenv';
dotenv.config();

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Summarize a function from a file using GPT‑4.1',
    (yargs) =>
      yargs.option('file', {
        alias: 'f',
        describe: 'Path to the source file',
        type: 'string',
        default: 'examples/foo.py',
      }),
    async (argv) => {
      const filePath = path.resolve(process.cwd(), argv.file as string);
      try {
        // 1. Read the source code
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // 2. Call GPT‑4.1 via Chat Completion
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            {
              role: 'user',
              content: `Summarize this function in one sentence:\n\n${fileContent}`,
            },
          ],
          // Optional parameters:
          // temperature: 0.2,
          // max_tokens: 200,
        });

        // 3. Output the summary
        console.log(completion.choices[0].message.content);
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
      }
    }
  )
  .demandCommand(1, 'You need to specify a command.')
  .help()
  .parse();
