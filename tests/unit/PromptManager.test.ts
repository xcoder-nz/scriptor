import fs from 'fs';
import path from 'path';
import { PromptManager } from '../../cli/prompts/PromptManager';

// Utility to escape RegExp metacharacters in a string
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('PromptManager', () => {
  const testDir = path.join(__dirname, 'test_templates');

  beforeEach(() => {
    // Recreate test directory
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
    fs.mkdirSync(testDir);

    // Base templates
    fs.writeFileSync(path.join(testDir, 'template1.txt'), 'This is template 1.');
    fs.writeFileSync(
      path.join(testDir, 'template2.txt'),
      'This is template 2 with {{variable}} and reuse {{variable}}.'
    );
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true });
  });

  it('loads templates from the specified directory', () => {
    const mgr = new PromptManager(testDir, false);
    const list = mgr.list().sort();
    expect(list).toEqual(['template1', 'template2']);
  });

  it('retrieves raw template content', () => {
    const mgr = new PromptManager(testDir, false);
    expect(mgr.raw('template1')).toBe('This is template 1.');
  });

  it('throws an informative error if a template is not found', () => {
    const mgr = new PromptManager(testDir, false);
    expect(() => mgr.raw('nope')).toThrow(
      new RegExp(`Prompt 'nope' not found in ${escapeRegExp(testDir)}`)
    );
  });

  it('renders a template by replacing all occurrences of a variable', () => {
    const mgr = new PromptManager(testDir, false);
    const out = mgr.render('template2', { variable: 'VALUE' });
    expect(out).toBe('This is template 2 with VALUE and reuse VALUE.');
  });

  it('leaves unknown placeholders intact', () => {
    const tpl = 'Hello {{name}}, welcome to {{site}}!';
    fs.writeFileSync(path.join(testDir, 'tpl.txt'), tpl);
    const mgr = new PromptManager(testDir, false);
    const rendered = mgr.render('tpl', { name: 'Alice' });
    expect(rendered).toBe('Hello Alice, welcome to {{site}}!');
  });

  it('renders multiple occurrences of the same variable', () => {
    const tpl = '{{x}} + {{x}} = {{sum}}';
    fs.writeFileSync(path.join(testDir, 'math.txt'), tpl);
    const mgr = new PromptManager(testDir, false);
    const result = mgr.render('math', { x: '2', sum: '4' });
    expect(result).toBe('2 + 2 = 4');
  });

  it('extracts variable names from a template', () => {
    const mgr = new PromptManager(testDir, false);
    expect(mgr.variables('template2')).toEqual(['variable']);
  });

  it('watches for new template files when watching is enabled', async () => {
    const mgr = new PromptManager(testDir, true);
    expect(mgr.list()).toEqual(expect.arrayContaining(['template1', 'template2']));
    // Add a new template after a short delay
    await new Promise<void>(resolve => {
      setTimeout(() => {
        fs.writeFileSync(path.join(testDir, 'template3.txt'), 'Third template.');
        setTimeout(() => {
          expect(mgr.list()).toEqual(
            expect.arrayContaining(['template1', 'template2', 'template3'])
          );
          resolve();
        }, 300);
      }, 100);
    });
    mgr.close();
  });

  it('close() does not throw when watcher is inactive or already closed', () => {
    const mgr = new PromptManager(testDir, true);
    mgr.close();  // first close
    expect(() => mgr.close()).not.toThrow();  // closing again is safe
  });
});
