# Translation Skill

AI-powered translation file synchronization for any AI coding assistant.

Edit your source language once — your AI handles the rest.

## What It Does

A set of markdown-based skill files that keep your project's translation files in sync. Works with **Claude Code**, **Cursor**, **GitHub Copilot**, **Windsurf**, **Cline**, **Aider**, and any AI coding tool that reads instruction files. It takes your source language file (e.g., `en.json`) as the single source of truth, detects what changed, and translates only the delta into all target languages — preserving existing translations, variables, and structure.

## Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Sync** | `/translation-sync` | Core sync: discover files, diff, translate, write |
| **Health** | `/translation-health` | Check coverage, dead keys, variable mismatches |
| **Review** | `/translation-review` | Quality review for accuracy, consistency, tone |
| **Extract** | `/translation-extract` | Find hardcoded strings in source code, propose keys |
| **Convert** | `/translation-convert` | Migrate between formats (JSON, YAML, PO, XLIFF, ARB) |
| **Guide** | `/translation-guide` | Generate or check a translation style guide |
| **Add Language** | `/translation-add-language` | Add a new target language to the project |

## Quick Start

### Claude Code

```bash
# Install as a plugin
claude plugin add https://github.com/irsali/translation-skill

# Then use any skill
/translation-sync
```

If no configuration exists, the skill auto-discovers your translation files and proposes a setup. On subsequent runs, it only translates what changed.

### Cursor

Add the skill files as project rules:

1. Copy the `skills/` folder into your project (or clone this repo alongside it)
2. In Cursor settings, add the SKILL.md files as custom instructions:
   - Go to **Settings → Rules for AI** and add:
     ```
     @file:skills/translation-sync/SKILL.md
     ```
3. Use in chat: _"Sync my translation files"_ or _"Run translation-sync"_

### GitHub Copilot

Use the skill files as custom instructions:

1. Copy `skills/translation-sync/SKILL.md` into `.github/copilot-instructions.md` or reference it in your workspace
2. In Copilot Chat, reference the file:
   ```
   @workspace /explain #file:skills/translation-sync/SKILL.md
   Sync my translation files following these instructions
   ```

### Windsurf / Cline / Aider

These tools support custom instruction files. Point them to the SKILL.md files:

- **Windsurf**: Add to `.windsurfrules` or reference in settings
- **Cline**: Add to `.clinerules` or custom instructions in settings
- **Aider**: Use `--read skills/translation-sync/SKILL.md` flag or add to `.aider.conf.yml`

### Manual Setup (Any AI Tool)

The skill files are plain markdown with structured instructions. For any AI coding tool:

1. Copy the relevant `SKILL.md` file content
2. Paste it into your tool's system prompt, custom instructions, or rules configuration
3. Ask the AI to follow the instructions on your project

### Configure (Optional)

Create a `.translation-sync.json` in your project root:

```json
{
  "sourceLanguage": "en",
  "sourceFile": "src/i18n/en.json",
  "targetLanguages": ["fr", "de", "es", "ja"],
  "format": "json",
  "keySort": "asc",
  "variablePatterns": "auto",
  "customInstructions": "Use formal tone. Keep technical terms in English."
}
```

Or skip the config file entirely and use natural language:

```
/translation-sync only French and German, formal tone, dry-run
```

## Features

### Smart Sync
Only translates new or changed keys. Existing valid translations are reused — no unnecessary re-translation.

### Variable Preservation
Automatically detects and preserves all variable/interpolation patterns:

| Syntax | Framework |
|--------|-----------|
| `{name}` | i18next, React Intl, Java MessageFormat |
| `{{name}}` | Angular, Handlebars, Laravel |
| `${name}` | ES6 template literals, Kotlin |
| `%s`, `%d` | C-style printf, Android |
| `%(name)s` | Python named format |
| `%{name}` | Ruby, Elixir Gettext |
| `$t(key)` | i18next nested references |
| `@:key` | Vue i18n linked messages |
| `{0}`, `{1}` | Positional (Java, C#, Flutter) |
| `%1$s` | Android positional printf |

### Git-Aware Change Detection
Detects which source keys changed using git, so only modified translations get updated:
- HEAD vs working tree (default)
- Staged changes only
- Last N commits
- Commit range

### Multi-Format Support
Works with JSON, YAML, PO (Gettext), XLIFF, ARB (Flutter), and Properties files.

### Context-Aware Translation
Claude reads your codebase to understand how translation keys are used — producing more accurate translations than isolated key-by-key translation.

### Deep Health Checks
Find dead keys (in translation files but not used in code), detect hardcoded strings that should be extracted, and validate variable integrity across all languages.

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sourceLanguage` | string | `"en"` | BCP-47 code of the source language |
| `sourceFile` | string | auto-detected | Path to the source translation file |
| `targetLanguages` | string[] | auto-detected | BCP-47 codes of target languages |
| `format` | string | auto-detected | File format: `json`, `yaml`, `po`, `xliff`, `arb`, `properties` |
| `keySort` | string | `"asc"` | Key sorting: `"asc"`, `"desc"`, or `"none"` |
| `variablePatterns` | string/string[] | `"auto"` | Variable detection: `"auto"` or explicit patterns |
| `customInstructions` | string | `""` | Project-specific translation guidelines |
| `modules` | object | `{}` | Module-based file patterns with `{lang}` placeholder |

## How It Works

1. **Discover** — Finds all translation files in your project
2. **Read** — Parses source and target files, flattens keys
3. **Diff** — Compares source against each target, classifies keys (reuse/translate/remove)
4. **Detect Changes** — Uses git to identify which source keys actually changed
5. **Translate** — Claude translates only the delta with full codebase context
6. **Validate** — Checks all variables are preserved in translations
7. **Write** — Outputs updated files with proper formatting and key ordering

## Compatibility

| Tool | Setup | Slash Commands |
|------|-------|----------------|
| **Claude Code** | `claude plugin add` | Yes (`/translation-sync`) |
| **Cursor** | Rules for AI | No — use natural language |
| **GitHub Copilot** | Custom instructions | No — use natural language |
| **Windsurf** | `.windsurfrules` | No — use natural language |
| **Cline** | `.clinerules` | No — use natural language |
| **Aider** | `--read` flag | No — use natural language |

Slash commands (`/translation-sync`, `/translation-health`, etc.) are a Claude Code feature. With other tools, use the same instructions via natural language — the SKILL.md files work identically as prompts.

## Requirements

- Any AI coding assistant that supports custom instructions or system prompts
- A project with translation files (or source code to extract from)
- Git (optional — enables smart change detection)

## License

AGPL-3.0 - Noble Wave

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](LICENSE) for details.
