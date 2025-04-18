import fs from 'fs';
import path from 'path';
import { PromptManager } from '../../cli/prompts/PromptManager';

describe('PromptManager', () => {
  const testDir = path.join(__dirname, 'test_templates');

  beforeEach(() => {
    fs.mkdirSync(testDir);
    fs.writeFileSync(path.join(testDir, 'template1.txt'), 'This is template 1.');
    fs.writeFileSync(path.join(testDir, 'template2.txt'), 'This is template 2 with {{variable}}.');
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true });
  });

  it('should load templates from the specified directory', () => {
    const manager = new PromptManager(testDir, false);
    expect(manager.list()).toEqual(['template1', 'template2']);
  });

  it('should retrieve a raw template', () => {
    const manager = new PromptManager(testDir, false);
    expect(manager.raw('template1')).toBe('This is template 1.');
  });

  it('should throw an error if a template is not found', () => {
    const manager = new PromptManager(testDir, false);
    expect(() => manager.raw('nonexistent')).toThrow('Prompt \'nonexistent\' not found');
  });

  it('should render a template with variables', () => {
    const manager = new PromptManager(testDir, false);
    const rendered = manager.render('template2', { variable: 'value' });
    expect(rendered).toBe('This is template 2 with value.');
  });

  it('should list all available templates', () => {
    const manager = new PromptManager(testDir, false);
    expect(manager.list()).toEqual(['template1', 'template2']);
  });

  it('should extract variable names from a template', () => {
    const manager = new PromptManager(testDir, false);
    expect(manager.variables('template2')).toEqual(['variable']);
  });

  it('should watch for changes in the template directory', async () => {
    const manager = new PromptManager(testDir);
    const newTemplatePath = path.join(testDir, 'template3.txt');

    // Initial templates should be template1 and template2, template3 should NOT exist
    expect(manager.list()).toEqual(expect.arrayContaining(['template1', 'template2']));
    expect(manager.list()).not.toContain('template3');

    await new Promise<void>((resolve) => {
      // Introduce a delay before writing the new file to ensure the watcher is set up
      setTimeout(() => {
        fs.writeFileSync(newTemplatePath, 'This is template 3.');

        // Wait for the watcher to pick up the change
        setTimeout(() => {
          expect(manager.list()).toEqual(expect.arrayContaining(['template1', 'template2', 'template3']));
          resolve();
        }, 500); // Adjust timeout as needed for file system events
      }, 100); // Short delay before writing the file
    });
    manager.close(); // Clean up the watcher
  });

  it('should close the file system watcher', () => {
    const manager = new PromptManager(testDir);
    manager.close();
    // While we can't directly verify the watcher is closed, this test ensures the close method doesn't throw errors.
    expect(true).toBe(true)
  });
  
});