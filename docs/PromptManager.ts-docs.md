1. Summary:
A module providing a PromptManager class for loading, watching, and rendering text templates from a directory, with functionality to list, fetch, render, and extract variables from prompts.

2. API Table:

| Name          | Type    | Description                                                             |
|---------------|---------|-------------------------------------------------------------------------|
| PromptManager | class   | Manages loading, watching, rendering, and variable extraction for templates. |

### Public Class: PromptManager

**Constructor**
```typescript
constructor(baseDir: string, watch = true)
```
- Initializes the manager with a directory of templates. Loads all `.txt` files and optionally watches for changes.

**Public Methods**

| Name                        | Signature                                                                             | Description                                                                                                  |
|-----------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| close                       | close(): void                                                                         | Stops watching the template directory for changes.                                                           |
| raw                         | raw(name: string): string                                                            | Returns the raw string contents of a named template. Throws if the template doesn't exist.                   |
| render                      | render(name: string, vars: Record<string, string>): string                           | Returns a template with variables replaced by provided values.                                                |
| list                        | list(): string[]                                                                     | Returns a list of all available template names.                                                              |
| variables                   | variables(name: string): string[]                                                    | Extracts and returns a list of unique variable names (`{{var}}`) in the named template.                      |

**Newly Added or Modified Methods**
- No newly added or modified methods detected; all are standard methods as expected for template management functionality.