import fs, { existsSync, mkdirSync, writeFileSync } from 'fs';
import { PromptManager } from '../../cli/prompts/PromptManager';

type MockAPIPromise<T> = AsyncGenerator<T, void, unknown>;
type MockPromptManager = Partial<PromptManager>;
type MockOpenAIInstance = Partial<{
  chat: Partial<{
    completions: Partial<{
      create: jest.Mock;
    }>;
  }>;
}>;

// 1) Mock fs module
jest.mock('fs');

// 2) Mock PromptManager so its constructor returns our mockPrompts
let mockPrompts: MockPromptManager;
jest.mock('../../cli/prompts/PromptManager', () => ({
  __esModule: true,
  PromptManager: jest.fn(() => mockPrompts),
}));

// 3) Mock OpenAI so `new OpenAI()` returns our mock instance
let mockOpenAIInstance: MockOpenAIInstance;
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAIInstance),
}));

// 4) Capture CLI handler
let registeredHandler: ((args: Record<string, unknown>) => Promise<unknown>) | null = null;
jest.mock('yargs', () => {
  const y = {
    command: jest.fn((cmd: string, desc: string, builder: unknown, handler: typeof registeredHandler) => {
      registeredHandler = handler;
      return y;
    }),
    demandCommand: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parse: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => y),
    hideBin: jest.fn((argv: string[]) => argv.slice(2)),
  };
});

describe('guessLanguage()', () => {
  let guessLanguage: (file: string) => string;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('../../cli/generate');
    guessLanguage = mod.guessLanguage;
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

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('../../cli/generate');
    splitSystemUser = mod.splitSystemUser;
  });

  it('splits SYSTEM and USER portions', () => {
    const tpl = '< SYSTEM >Hello END SYSTEM World';
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

  beforeEach(async () => {
    jest.resetModules();

    mockPrompts = {
      variables: jest.fn().mockReturnValue(['code', 'language', 'additional_context']),
      render: jest.fn().mockReturnValue('< SYSTEM >SYS END SYSTEM USR'),
      close: jest.fn(),
    };
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue((async function* () {
            yield { choices: [{ delta: { content: 'Hello ' } }] };
            yield { choices: [{ delta: { content: 'World!' } }] };
          })() as MockAPIPromise<{ choices: [{ delta: { content: string } }] }>)
        }
      }
    };

    const mod = await import('../../cli/generate');
    runAgent = mod.runAgent;
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
      additional_context: ''
    });
    expect(result).toBe('Hello World!');
  });
});

describe('CLI integration (generate command)', () => {
  beforeEach(async () => {
    jest.resetModules();

    (fs.readFileSync as jest.Mock).mockReturnValue('some code');
    (existsSync as jest.Mock).mockReturnValue(false);
    (mkdirSync as jest.Mock).mockImplementation(() => {});
    (writeFileSync as jest.Mock).mockImplementation(() => {});

    mockPrompts = {
      variables: jest.fn().mockReturnValue(['code', 'language', 'additional_context']),
      render: jest.fn().mockReturnValue('< SYSTEM >SYS END SYSTEM USR'),
      close: jest.fn(),
    };
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue((async function* () {
            yield { choices: [{ delta: { content: 'RESULT' } }] };
          })() as MockAPIPromise<{ choices: [{ delta: { content: string } }] }>)
        }
      }
    };

    await import('../../cli/generate');
  });

  it('--out is set → logs "Saved output to:" then exits(1)', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`EXIT:${code}`); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(registeredHandler).toBeDefined();
    await expect(
      registeredHandler!({ prompt: 'myprompt', file: 'foo.py', additional_context: '', language: '', out: true })
    ).rejects.toThrow('EXIT:1');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Saved output to:'));

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('--out not set → does not log saved‑output, still exits(1)', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`EXIT:${code}`); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      registeredHandler!({ prompt: 'myprompt', file: 'foo.py', additional_context: '', language: '', out: false })
    ).rejects.toThrow('EXIT:1');

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Saved output to:'));

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
