import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';
import nock from 'nock';

describe('CLI End‑to‑End (function-summary)', () => {
  let fixtureDir: string;
  let fixtureFile: string;

  const nodeBin = process.execPath;
  const setupNock = path.resolve(__dirname, 'setupNock.js');
  const cliScript = path.resolve(__dirname, '../../cli/generate.ts');
  const cwd = path.resolve(__dirname, '../../');

  beforeAll(() => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scriptor-int-'));
    fixtureFile = path.join(fixtureDir, 'foo.py');
    fs.writeFileSync(
      fixtureFile,
      [
        'def foo(a: int, b: int) -> int:',
        '    """Return sum of a and b."""',
        '    return a + b',
      ].join('\n'),
      'utf8'
    );
  });

  afterAll(() => {
    nock.cleanAll();
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it('streams the dummy summary and example, then exits(0)', async () => {
    const result = await execa(
      nodeBin,
      [
        '-r', 'ts-node/register',
        '-r', setupNock,
        cliScript,
        'generate',
        'function-summary',
        '--file', fixtureFile,
      ],
      { reject: false, cwd }
    );

    // SUCCESS exit should be 0
    expect(result.exitCode).toBe(0);

    // Now we see exactly our dummy summary + usage example
    expect(result.stdout).toContain('**Summary:** Dummy function that adds two numbers.');
    expect(result.stdout).toContain('**Usage Example:**');
    expect(result.stdout).toContain('result = foo(2, 3)  # 5');

    // Snapshot the full output for future regression checks
    expect(result.stdout).toMatchSnapshot();
  });

  it('exits(1) and reports unknown prompt', async () => {
    const result = await execa(
      nodeBin,
      [
        '-r', 'ts-node/register',
        '-r', setupNock,
        cliScript,
        'generate',
        'no-such-prompt',
        '--file', fixtureFile,
      ],
      { reject: false, cwd }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Prompt 'no-such-prompt' not found/);
  });
});