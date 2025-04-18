1. Summary:  
This module provides a CLI tool to run customizable AI-powered code documentation prompts using OpenAI's API. It reads a code file, selects and renders a prompt template (with variable injection), communicates over streaming API with OpenAI, and optionally outputs markdown documentation files.

2. API Table:

| Name                | Type     | Description                                                                                         |
|---------------------|----------|-----------------------------------------------------------------------------------------------------|
| guessLanguage       | function | Infers the programming language of a file by its extension.                                         |
| splitSystemUser     | function | Splits a prompt template into system and user messages for use in a chat-based AI completion.       |
| runAgent            | function | Orchestrates variable gathering, prompt rendering, OpenAI chat call, and output streaming.          |
| PromptManager       | class    | Imported: Manages prompt templates and rendering (implementation not shown in this module).         |
| yargs command setup | function | CLI command registration, parses CLI args, and runs logic using runAgent and supporting utilities.  |

#### Function Details

- **guessLanguage(file: string): string**  
  Returns the language string (e.g., 'python', 'typescript', 'js', etc.) for the given file path using extension matching.

- **splitSystemUser(template: string): { system: string, user: string }**  
  Extracts a special `< SYSTEM >...END SYSTEM` block (for system prompt) and returns remaining template as the user message.

- **runAgent(promptName: string, filePath: string, code: string, cliVars: Record<string, string>): Promise<string>**  
  Main orchestrator: Gathers required variables via PromptManager, renders the prompt, splits it for OpenAI chat API, streams and collects AI output, and returns the result.

- **PromptManager** (import)  
  Handles loading, rendering, and variable management of prompt templates. Assumed to expose `.variables()`, `.render()`, and `.close()`.

- **yargs command setup**  
  Defines a CLI command generate <prompt>, registering arguments for prompt/template, input file, extra context, language, and output options. Handles file reading, invokes runAgent, and writes output to docs/ as needed.

#### Imported Classes and Methods

| Class         | Method Signature                                         | Purpose                                             |
|---------------|---------------------------------------------------------|-----------------------------------------------------|
| PromptManager | variables(name: string): string[]                       | Returns variable names needed by a prompt template.  |
|               | render(name: string, vars: Record<string, string>): str | Renders a prompt template with variables.            |
|               | close(): void                                           | Closes any resources held by the PromptManager.      |

_Newly added/modified methods: None in this module; core logic is entirely within top-level functions and CLI setup. Changes to PromptManager or external modules are not shown._

---

If more detail is needed about PromptManager, its implementation should be checked in `./prompts/PromptManager`.  
No user-defined TypeScript classes are declared directly in this module.