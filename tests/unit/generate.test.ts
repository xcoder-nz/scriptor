// tests/unit/generate.test.ts

import fs from 'fs';
jest.mock('fs');
import path from 'path';

let mockPrompts: any;
let mockOpenAIInstance: any;
let registeredHandler: ((args: any) => Promise<any>) | null = null;

// 1) Mock PromptManager so its constructor returns `mockPrompts`
jest.mock('../../cli/prompts/PromptManager', () => ({
  __esModule: true,
  PromptManager: jest.fn(() => mockPrompts),
}));

// 2) Mock OpenAI so `new OpenAI()` returns our `mockOpenAIInstance`
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAIInstance),
}));

// 3) Mock yargs to capture the CLI handler into `registeredHandler`
jest.mock('yargs', () => {
  const yargsMock = {
    command: jest.fn(
      (_cmd: string, _desc: string, _builder: any, handler: (args: any) => Promise<any>) => {
        registeredHandler = handler;
        return yargsMock;
      }
    ),
    demandCommand: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parse: jest.fn(), // no-op; we'll invoke registeredHandler manually
  };
  return {
    __esModule: true,
    default: jest.fn(() => yargsMock),
    hideBin: jest.fn((argv: string[]) => argv.slice(2)),
  };
});

//
// --- Tests for pure functions
//

describe('guessLanguage()', () => {
  let guessLanguage: (file: string) => string;

  beforeEach(() => {
    jest.resetModules();
    const { guessLanguage: gl } = require('../../cli/generate');
    guessLanguage = gl;
  });

  it('maps extensions correctly', () => {
    expect(guessLanguage('foo.py')).toBe('python');
    expect(guessLanguage('app.js')).toBe('javascript');
    expect(guessLanguage('data.json')).toBe('json');
  });

  it('falls back for unknown extensions', () => {
    expect(guessLanguage('foo.xyz')).toBe('xyz');
  });

  it('returns "text" when no extension', () => {
    expect(guessLanguage('README')).toBe('text');
  });
});

describe('splitSystemUser()', () => {
  let splitSystemUser: (tpl: string) => { system: string; user: string };

  beforeEach(() => {
    jest.resetModules();
    const { splitSystemUser: ssu } = require('../../cli/generate');
    splitSystemUser = ssu;
  });

  it('splits SYSTEM and USER portions', () => {
    const tpl = `< SYSTEM >Hello END SYSTEM World`;
    const { system, user } = splitSystemUser(tpl);
    expect(system).toBe('Hello');
    expect(user).toBe('World');
  });

  it('uses default system prompt if missing', () => {
    const { system, user } = splitSystemUser('Just user text');
    expect(system).toBe('You are a helpful assistant.');
    expect(user).toBe('Just user text');
  });
});

describe('runAgent()', () => {
  let runAgent: (
    promptName: string,
    filePath: string,
    code: string,
    cliVars: Record<string, string>
  ) => Promise<string>;

  beforeEach(() => {
    jest.resetModules();

    mockPrompts = {
      variables: jest.fn().mockReturnValue(['code', 'language', 'additional_context']),
      render:    jest.fn().mockReturnValue('< SYSTEM >SYS END SYSTEM USR'),
      close:     jest.fn(),
    };
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(
            (async function* () {
              yield { choices: [{ delta: { content: 'Hello ' } }] };
              yield { choices: [{ delta: { content: 'World!' } }] };
            })()
          ),
        },
      },
    };

    const { runAgent: ra } = require('../../cli/generate');
    runAgent = ra;
  });

  it('streams tokens and returns full result', async () => {
    const result = await runAgent(
      'myprompt',
      'foo.py',
      'print("hi")',
      { language: 'python', additional_context: '' }
    );

    expect(mockPrompts.variables).toHaveBeenCalledWith('myprompt');
    expect(mockPrompts.render).toHaveBeenCalledWith('myprompt', {
      code: 'print("hi")',
      language: 'python',
      additional_context: '',
    });
    expect(result).toBe('Hello World!');
  });
});

//
// --- CLI integration tests
//

describe('CLI integration (generate command)', () => {
  beforeEach(() => {
    jest.resetModules();

    // Stub fs methods
    (fs.readFileSync as jest.Mock).mockReturnValue('some code');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync   as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    mockPrompts = {
      variables: jest.fn().mockReturnValue(['code', 'language', 'additional_context']),
      render:    jest.fn().mockReturnValue('< SYSTEM >SYS END SYSTEM USR'),
      close:     jest.fn(),
    };
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(
            (async function* () {
              yield { choices: [{ delta: { content: 'RESULT' } }] };
            })()
          ),
        },
      },
    };

    // Load CLI so yargs.command registers our handler
    require('../../cli/generate');
  });

  it('--out is set → logs "Saved output to:" then exits(1)', async () => {
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number) => { throw new Error(`EXIT:${code}`); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      registeredHandler!({
        prompt: 'myprompt',
        file: 'foo.py',
        additional_context: '',
        language: '',
        out: true,
      })
    ).rejects.toThrow('EXIT:1');

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Saved output to:')
    );

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('--out not set → does not log saved‑output, still exits(1)', async () => {
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number) => { throw new Error(`EXIT:${code}`); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      registeredHandler!({
        prompt: 'myprompt',
        file: 'foo.py',
        additional_context: '',
        language: '',
        out: false,
      })
    ).rejects.toThrow('EXIT:1');

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Saved output to:')
    );

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
