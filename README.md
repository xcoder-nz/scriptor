# Scriptor
  
[![npm version](https://badge.fury.io/js/scriptor.svg)](https://badge.fury.io/js/scriptor)  
[![License](https://img.shields.io/github/license/xcoder-nz/scriptor)](LICENSE)  
[![Build Status](https://github.com/xcoder-nz/scriptor/actions/workflows/ci.yml/badge.svg)](https://github.com/xcoder-nz/scriptor/actions)

Scriptor is your AI‑driven “Docs CI/CD” for codebases: continuously generate, validate, and enrich Markdown docs, code examples, and diagram, directly in your CLI, IDE, or web portal.  

> “Make documentation as effortless, reliable and dynamic as writing code.”

---

## Table of Contents  
- [Features](#features)  
- [Getting Started](#getting-started)  
- [Usage](#usage)  
- [Prompt Templates](#prompt-templates)  
- [Testing](#testing)  
- [Roadmap](#roadmap)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Features  
- **Continuous Documentation**: GitHub Action or CLI plugin auto‑comments PRs with fresh docs.  
- **Multi‑Prompt Agent**: `function-summary`, `module-overview`, `changelog` templates, hot‑reloadable via `PromptManager`.  
- **Streaming & Large Context**: Leverage GPT‑4.1’s 1 M token window and streaming API for real‑time feedback.  
- **IDE Integrations**: VS Code & JetBrains plugins for inline docs.  
- **Web Portal**: (“Scriptor Hub”) TBD, for cross‑functional stakeholders.  

---

## Getting Started

### Prerequisites  
- Node.js ≥ 18 LTS  
- npm or yarn  
- OpenAI API key (for local dev via `.env`) 

### Installation  
```bash
git clone https://github.com/xcoder-nz/scriptor.git
cd scriptor
npm install
```

Create a `.env` file at project root:  
```bash
echo "OPENAI_API_KEY=sk-…" > .env
```

---

## Usage

### CLI  
```bash
# Summarize a function
npx ts-node cli/generate.ts generate function-summary --file examples/foo.py

# Module overview
npx ts-node cli/generate.ts generate module-overview --file examples/analytics.py

# Changelog
npx ts-node cli/generate.ts generate changelog --file examples/change.diff
```

### GitHub Action  
Add to `.github/workflows/docs.yml`:
```yaml
on: [pull_request]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: xcoder-nz/scriptor-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

## Prompt Templates  
Located in `cli/prompts/`:
- **function-summary.txt**: Summarizes single functions.  
- **module-overview.txt**: Lists classes/methods in tables.  
- **changelog.txt**: Generates Markdown changelogs from diffs.  

Edit these `.txt` files on‑the‑fly—no recompilation required.

---

## Testing  
```bash
npm test        # runs Jest unit & integration tests
npm run lint    # ESLint checks
npm run type    # TypeScript compiler checks
```

CI is configured in `.github/workflows/ci.yml` to run tests on push and PR citeturn0search4.

---

## Roadmap  
See [ROADMAP.md](ROADMAP.md) for upcoming milestones: v1.0 IDE plugins, v1.1 Web Portal, Enterprise features.

---

## Contributing  
1. Fork the repo  
2. Create a feature branch (`git checkout -b feat/name`)  
3. Run tests (`npm test`)  
4. Open a PR and reference this issue

Please follow the [Standard Readme Spec](https://github.com/RichardLitt/standard-readme).

---

## License  
MIT © XCoder NZ