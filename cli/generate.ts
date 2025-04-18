import dotenv from 'dotenv';
dotenv.config();

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PromptManager } from './prompts/PromptManager';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const prompts = new PromptManager(path.join(__dirname, 'prompts'), false);

function guessLanguage(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (!ext) return 'text';
  const langMap: Record<string, string> = {
    '.py': 'python',
    '.ts': 'typescript',
    '.js': 'javascript',
    '.json': 'json',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    // add more as needed!
  };
  return langMap[ext] || ext.replace('.', '');
}

/** Extract < SYSTEM >...</END SYSTEM> as system, remainder as user */
function splitSystemUser(template: string): { system: string, user: string } {
  const sysMatch = template.match(/< SYSTEM >\s*([\s\S]*?)\s*END SYSTEM/);
  const system = sysMatch ? sysMatch[1].trim() : 'You are a helpful assistant.';
  const user = template.replace(/< SYSTEM >[\s\S]*?END SYSTEM/, '').trim();
  return { system, user };
}

async function runAgent(
  promptName: string,
  filePath: string,
  code: string,
  cliVars: Record<string, string>
): Promise<string> {
  // 1. Get required variables for the prompt
  const templateVars = prompts.variables(promptName);

  // 2. Build variable object, trying to fill sensible defaults if missing from CLI
  const variables: Record<string, string> = {};
  for (const v of templateVars) {
    if (cliVars[v]) {
      variables[v] = cliVars[v];
    } else if (v.toLowerCase().includes('code')) {
      variables[v] = code;
    } else if (v === 'language') {
      variables[v] = guessLanguage(filePath);
    } else if (v === 'additional_context') {
      variables[v] = '';
    } else {
      variables[v] = ''; // Default: empty
    }
  }

  // 3. Render prompt
  const rendered = prompts.render(promptName, variables);

  // 4. Split system and user message
  const { system, user } = splitSystemUser(rendered);

  // 5. OpenAI API call
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    stream: true,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'text' },
    temperature: 1,
    max_completion_tokens: 32768,
  });

  let result = '';
  for await (const chunk of response) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      process.stdout.write(token);
      result += token;
    }
  }
  console.log();
  return result;
}

// --- CLI interface

yargs(hideBin(process.argv))
  .command(
    'generate <prompt>',
    'Run the named AI prompt against a source file with streaming output',
    (y) => y
      .positional('prompt', {
        describe: 'Prompt template name from ./prompts',
        type: 'string',
      })
      .option('file', {
        alias: 'f',
        describe: 'Path to the code file (or diff) to process',
        type: 'string',
        default: 'examples/foo.py',
      })
      .option('additional_context', {
        alias: 'c',
        describe: 'Additional context string to provide to the prompt.',
        type: 'string',
        default: '',
      })
      .option('language', {
        alias: 'l',
        describe: 'Force language (otherwise guessed from file extension).',
        type: 'string',
      })
      .option('out', {
        alias: 'o',
        describe: 'If true, write the output to docs/<filename>-docs.md',
        type: 'boolean',
        default: false,
      }),
    async ({ prompt, file, additional_context, language, out }) => {
      const filePath = path.resolve(process.cwd(), file as string);
      const code = fs.readFileSync(filePath, 'utf-8');
      const cliVars: Record<string, string> = {
        additional_context: additional_context || '',
        language: language as string || '',
      };
      try {
        const result = await runAgent(prompt as string, filePath, code, cliVars);

        // >>>>>>>>>>>> OUTPUT TO MARKDOWN FILE IF --out
        if (out) {
          const docsDir = path.join(process.cwd(), 'docs');
          if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir);
          }
          const srcBase = path.basename(filePath);
          const outBase = `${srcBase}-docs.md`;   
          const outPath = path.join(docsDir, outBase);
          fs.writeFileSync(outPath, result, 'utf8');
          console.log(`\nSaved output to: ${outPath}\n`);
        }
        // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        prompts.close();
        process.exit(0);
      } catch (err: any) {
        console.error('Agent error:', err.message);
        prompts.close();
        process.exit(1);
      }
    }
  )
  .demandCommand(1, 'Specify a prompt name.')
  .help()
  .parse();