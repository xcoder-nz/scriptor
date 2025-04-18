import fs from 'fs';
import path from 'path';

export class PromptManager {
  private templates: Record<string, string> = {};
  private watcher: fs.FSWatcher | null = null;

  constructor(private baseDir: string, private watch = true) {
    this.loadAll();
    if (this.watch) this.watchForChanges();
  }

  private loadAll() {
    const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.txt'));
    for (const file of files) {
      const key = path.basename(file, '.txt');
      this.templates[key] = fs.readFileSync(path.join(this.baseDir, file), 'utf-8');
    }
  }

  private watchForChanges() {
    this.watcher = fs.watch(this.baseDir, (_, file) => {
      if (file && file.endsWith('.txt')) this.loadAll();
    });
  }

  public close() {
    this.watcher?.close();
  }

  raw(name: string): string {
    const tpl = this.templates[name];
    if (!tpl) throw new Error(`Prompt '${name}' not found in ${this.baseDir}`);
    return tpl;
  }

  render(name: string, vars: Record<string, string>): string {
    let output = this.raw(name);
    for (const [k, v] of Object.entries(vars)) {
      output = output.split(`{{${k}}}`).join(v);
    }
    return output;
  }

  list(): string[] {
    return Object.keys(this.templates);
  }

  // EXTRACT all variable names from a template
  variables(name: string): string[] {
    const tpl = this.raw(name);
    const matches = [...tpl.matchAll(/{{(\w+)}}/g)];
    return Array.from(new Set(matches.map(m => m[1])));
  }
}