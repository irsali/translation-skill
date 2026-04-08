# Translation Skill — Vision & Foundation

> **From VS Code Extension to Claude Code Skill: Making AI-powered translation sync universally accessible.**

---

## 1. What We're Building

A **Claude Code skill** (distributed as a plugin) that brings intelligent translation file synchronization to any developer using Claude Code — regardless of their IDE, platform, or AI provider.

The skill takes a source language file (e.g., `en.json`) as the single source of truth, detects what changed, and translates only the delta into all target languages — preserving existing translations, placeholders, and key structure.

### The One-Liner

```
/translation-sync
```

That's it. One command. Claude discovers your translation files, figures out what changed, translates what's needed, and writes the results — all orchestrated through natural language instructions, not hard-coded logic.

---

## 2. What We Already Have (MCP Translation Sync)

The existing VS Code extension (`mcp-translation-sync` v2.0.3) is a production-grade tool with:

| Capability | Details |
|------------|---------|
| **Smart sync** | Only translates new/changed keys — reuses existing valid translations |
| **Batch translation** | 20 keys per request, 95% fewer API calls |
| **Git-aware** | 6 strategies for detecting source changes (HEAD vs working, staged, commit range, etc.) |
| **Placeholder preservation** | Detects `{name}`, `{{count}}`, `%s`, `${var}`, `[key]` patterns |
| **Auto-discovery** | Finds all translation files in a project automatically |
| **Multi-module** | Supports separate translation modules (admin, common, blog) |
| **Key sorting** | Alphabetical ordering (asc/desc, case-sensitive/insensitive) |
| **Dry-run** | Preview all changes without writing files |
| **Health checks** | Detects missing files, out-of-sync translations, undiscovered files |
| **Custom instructions** | Project-specific translation guidelines (tone, formality, terminology) |
| **192 tests** | Comprehensive unit + integration test coverage |

### Architecture Highlights Worth Preserving

- **Pipeline pattern** — modular stages: categorize → translate → merge → write
- **Smart reuse logic** — exists + valid + unchanged source + placeholders match = skip translation
- **Configuration hierarchy** — settings → env vars → defaults
- **Custom error classes** — typed errors for every failure mode
- **JSON diff engine** — flatten/unflatten, key ordering, structural comparison

---

## 3. Possibilities — What a Skill Can Do

### 3.1 Core Translation Operations

| Feature | Feasibility | How |
|---------|-------------|-----|
| **Discover translation files** | ✅ High | Glob patterns + directory scanning via Claude's tools |
| **Diff source vs targets** | ✅ High | Read files, Claude performs JSON comparison natively |
| **Translate missing/changed keys** | ✅ High | Claude itself IS the translation engine — no external API needed |
| **Preserve placeholders** | ✅ High | Instruction-based: tell Claude the rules, it follows them |
| **Key sorting** | ✅ High | Claude can sort JSON keys when writing output |
| **Dry-run mode** | ✅ High | Read and report without calling Write |
| **Git change detection** | ✅ High | Bash tool runs git commands directly |
| **Health checks** | ✅ High | Compare file sets, report gaps |
| **Multi-format support** | ✅ High | JSON, YAML, PO, XLIFF — Claude understands all natively |

### 3.2 Enhanced Capabilities (New in Skill)

These are things the skill can do that the VS Code extension *couldn't easily*:

| Feature | Why It's New |
|---------|-------------|
| **Claude IS the translator** | No external API dependency. Claude translates directly with full context understanding. Higher quality than generic translation APIs. |
| **Multi-format native support** | Claude reads/writes JSON, YAML, PO, XLIFF, ARB, Properties files natively. The extension only handled JSON. |
| **Context-aware translation** | Claude can read your codebase to understand *how* a key is used (UI label vs error message vs tooltip) and translate accordingly. |
| **Natural language configuration** | `"/translation-sync only French and German with formal tone"` — no config files needed. |
| **Cross-repo operation** | Skills work anywhere Claude Code runs — not locked to VS Code. |
| **Conversation memory** | Claude remembers project-specific translation preferences across sessions. |
| **Review mode** | Claude can review existing translations for quality, consistency, and accuracy. |
| **Migration assistance** | Convert between translation formats (JSON → YAML, PO → JSON, etc.) |

### 3.3 The Paradigm Shift: Translating Blind vs. Translating With Eyes Open

The extension sends `"submit_button": "Submit"` to Copilot in isolation. The skill operates fundamentally differently:

**Codebase-Aware Translation**
Claude can read the component where `submit_button` is used — is it a destructive action? A form submit? A payment confirmation? That context changes the translation. A `"delete"` button in a settings page needs a different tone than a `"delete"` on a data wipe dialog.

**Sibling-Key Coherence**
When `cancel_button`, `save_button`, and `delete_button` are siblings, Claude translates them as a cohesive set — consistent tone, verb form, and length — rather than optimizing each in isolation.

**Whole-File-at-Once Processing**
The extension batches 20 keys per API call. Claude can process hundreds of keys in a single pass with full context, seeing the entire translation file as a coherent document rather than fragmented batches.

**Multi-Language Simultaneous Awareness**
The extension processes one language file at a time. Claude can diff and translate across all target languages in one orchestrated pass, spotting cross-language inconsistencies (e.g., a concept translated differently in `fr.json` module A vs module B).

### 3.4 Entirely New Capability Categories

These aren't enhancements to existing features — they're categories that **didn't exist** in the extension:

#### String Extraction from Source Code
```
/translation-extract
```
Claude reads your `.tsx`, `.vue`, `.svelte`, `.dart` files, finds hardcoded strings like `<button>Submit</button>` or `alert("Something went wrong")`, and proposes translation keys + adds them to the source file. The extension had zero awareness of source code.

#### Dead Key Detection
```
/translation-health --deep
```
Claude greps the entire codebase for actual key usage. Keys in translation files that aren't referenced anywhere get flagged. This is a feature teams currently pay for in SaaS tools like Lokalise and Crowdin.

#### Holistic Quality Review
Not key-by-key checking — Claude reads *all* translations across *all* languages and identifies:
- **Inconsistent terminology** — same concept translated differently across files/modules
- **Tone mismatches** — formal in one section, casual in another
- **Length problems** — German translations that will overflow UI containers
- **Cultural issues** — idioms that don't translate, date/number format assumptions baked into strings
- **Missing pluralization** — languages with complex plural rules (Russian: 3 forms, Arabic: 6) served with only singular/plural

#### Translation Style Guide Generation
```
/translation-guide
```
Claude analyzes existing translations and *generates* a style guide from what's already there: "Your German translations use 'Sie' (formal). Spanish uses 'tú' (informal). Button labels use imperative mood. Error messages use passive voice." This becomes the `customInstructions` baseline that enforces consistency going forward — a living document derived from your actual patterns.

#### Contextual Pluralization & ICU MessageFormat
The extension treats `"items_count": "{count} items"` as a flat string. Claude understands pluralization rules per language and can generate proper ICU MessageFormat:
```json
{
  "items_count": "{count, plural, one {# item} other {# items}}",
  "days_remaining": "{count, plural, one {# day remaining} other {# days remaining}}"
}
```
For Russian, Arabic, and other complex plural systems, it generates the correct number of forms automatically.

#### PR-Ready Output & Changelog
After syncing, Claude generates a translation diff summary suitable for a PR description — what was added, changed, removed, and reused — with example translations for reviewer context. No more opaque "updated translation files" commit messages.

### 3.5 Skill Variants (Sub-Skills)

The plugin offers a focused skill set, each doing one thing well:

| Skill | Purpose | Extension Equivalent |
|-------|---------|---------------------|
| `/translation-sync` | Core sync: discover, diff, translate, write | ✅ Existed (core feature) |
| `/translation-review` | Quality review across all languages | ❌ **New** |
| `/translation-health` | Coverage + dead keys + deep codebase analysis | Partial (basic health only) |
| `/translation-extract` | Find hardcoded strings in source, propose keys | ❌ **New** |
| `/translation-convert` | Format migration (JSON ↔ YAML ↔ PO ↔ XLIFF ↔ ARB) | ❌ **New** |
| `/translation-guide` | Generate & enforce a translation style guide | ❌ **New** |
| `/translation-add-language` | Add a new target language interactively | ✅ Existed |

The extension was a translation **tool**. The skill is a translation **partner** — one that understands your code, your conventions, and your intent.

---

## 4. Challenges — What's Different

### 4.1 Architecture Shift

| Aspect | VS Code Extension | Claude Code Skill |
|--------|-------------------|-------------------|
| **Execution model** | Compiled TypeScript, deterministic | Prompt-driven, Claude orchestrates |
| **Translation engine** | GitHub Copilot LM API | Claude itself (or external APIs via curl) |
| **State management** | VS Code workspace state, settings | Stateless per invocation; files for persistence |
| **UI** | Command palette, chat participant, progress bars | Text output, markdown reports |
| **Configuration** | VS Code settings.json, typed config | Natural language args + `.claude/settings.json` + project config file |
| **Error handling** | Try/catch, typed errors | Instruction-based ("if X fails, do Y") |
| **Testing** | Vitest, 192 unit/integration tests | Harder to test — prompt-based behavior isn't deterministic |

### 4.2 Key Challenges

**Challenge 1: Non-Deterministic Behavior**
Skills are prompt-driven. The same input may produce slightly different behavior across invocations. Mitigation: write very precise instructions, use scripts for critical operations (JSON parsing, file writing), validate outputs.

**Challenge 2: Large File Handling**
Translation files can be massive (10,000+ keys). Claude's context window is large but not infinite. Mitigation: chunk processing, stream results, use scripts for mechanical operations.

**Challenge 3: No Persistent Process**
The extension runs continuously and can watch files. A skill runs on-demand only. Mitigation: pair with hooks (`PreToolUse`, file watchers) or scheduled triggers for automation.

**Challenge 4: Testing Strategy**
Can't unit-test a prompt the way you test TypeScript. Mitigation: extract deterministic logic into scripts (JSON diff, placeholder validation), test those. Use integration tests that invoke the skill and validate file outputs.

**Challenge 5: Batching & Performance**
The extension batches 20 keys per API call. With Claude as the translator, we can send much larger batches (Claude can handle hundreds of keys in one pass), but we need to handle context limits gracefully.

**Challenge 6: Configuration Portability**
Users of the VS Code extension have existing `settings.json` configs. The skill needs a migration path or compatibility layer.

---

## 5. Opportunities — Where Skills Win

### 5.1 Broader Reach

| Distribution | VS Code Extension | Claude Code Skill |
|-------------|-------------------|-------------------|
| VS Code users | ✅ | ✅ (via CLI/extension) |
| JetBrains users | ❌ | ✅ |
| Vim/Neovim users | ❌ | ✅ |
| Terminal-only users | ❌ | ✅ |
| CI/CD pipelines | ❌ | ✅ (via Claude Code CLI) |
| Web (claude.ai/code) | ❌ | ✅ |

### 5.2 Zero-Dependency Translation

The biggest opportunity: **Claude itself is a world-class translator.** No need for:
- External translation API keys (DeepL, Google Translate, AWS)
- API rate limits and costs from third-party services
- Network calls to external services

Claude understands context, idioms, formality levels, technical terminology, and cultural nuances natively. This is arguably *better* than the extension's approach of using Copilot as a translation proxy.

### 5.3 AI-Native Workflows

- **Code-aware translation**: Claude can read your components to understand context ("this key is used in an error dialog" → translate with appropriate urgency/tone)
- **Translation review**: "Review my German translations for consistency" — Claude reads all files and provides feedback
- **Glossary enforcement**: Define terminology once, Claude applies it everywhere
- **Contextual instructions**: "Use formal 'Sie' for German, informal 'tú' for Spanish" — natural language config
- **Conversational iteration**: "That German translation for 'submit_button' sounds too stiff, make it friendlier" — Claude adjusts in real-time with the conversation context

### 5.4 CI/CD Integration

```yaml
# GitHub Actions example
- name: Sync translations
  run: claude-code --skill translation-sync --non-interactive
```

Skills can run in CI pipelines via Claude Code CLI, enabling automated translation on every PR that touches the source language file. Combined with scheduled triggers, this enables fully automated translation workflows:

```yaml
# Nightly translation sync
- cron: '0 2 * * *'
  name: Nightly translation sync
  run: claude-code --skill translation-sync --non-interactive
```

### 5.5 Plugin Marketplace

Anthropic's plugin marketplace provides a built-in distribution channel. Users discover and install with one click — no VS Code marketplace listing, no extension packaging, no vsix files.

### 5.6 The Architectural Advantage

The extension's architecture is: **deterministic pipeline → external API → deterministic merge**. The intelligence lives in the code *around* the translation, not *in* it.

The skill inverts this: **the intelligence IS the translator AND the orchestrator**. Claude doesn't need a rigid pipeline of categorize → batch → call API → parse → validate → merge. Claude *understands* the task holistically. Helper scripts exist only for mechanical safety (writing valid JSON, preserving file encoding) — not for orchestration logic.

This means:
- **No batching complexity** — Claude processes entire files with full context
- **No prompt engineering layer** — Claude doesn't need to be told how to translate; it needs to be told the *project's rules*
- **No response parsing** — no fragile regex to extract translations from API responses
- **Richer error recovery** — Claude can reason about *why* something failed and adapt, rather than blindly retrying

---

## 6. Deployment Strategy

### Phase 1: Local Skill (MVP)

**Goal**: Working skill that handles the core sync workflow.

```
translation-skill/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata & registration
├── skills/
│   ├── translation-sync/
│   │   └── SKILL.md             # Core sync: discover, diff, translate, write
│   ├── translation-review/
│   │   └── SKILL.md             # Quality review across languages
│   ├── translation-health/
│   │   └── SKILL.md             # Coverage, dead keys, deep analysis
│   ├── translation-extract/
│   │   └── SKILL.md             # Find hardcoded strings, propose keys
│   ├── translation-convert/
│   │   └── SKILL.md             # Format migration between i18n formats
│   ├── translation-guide/
│   │   └── SKILL.md             # Generate/enforce translation style guide
│   └── translation-add-language/
│       └── SKILL.md             # Add a new target language interactively
├── scripts/                     # Helper scripts for deterministic operations
│   ├── diff.js                  # JSON diff engine (flatten, compare, report)
│   ├── validate.js              # Placeholder validation & mismatch detection
│   └── merge.js                 # Safe JSON merge with key ordering
├── templates/
│   └── config.example.json      # Example project configuration
├── VISION.md                    # This document
├── README.md                    # User-facing documentation
└── LICENSE
```

**Distribution**: Install locally or from git repo.

### Phase 2: Plugin Marketplace

**Goal**: Published on Anthropic's plugin marketplace.

- Polish skill instructions for reliability
- Add comprehensive examples and edge case handling
- Write user documentation
- Submit to marketplace

### Phase 3: CI/CD & Automation

**Goal**: Translation sync as part of automated workflows.

- Scheduled triggers (daily translation sync)
- Git hooks integration (sync on commit to source file)
- PR bot (auto-translate and open PR when source changes)
- GitHub Action wrapper

### Phase 4: Enterprise Features

**Goal**: Team and organization-level features.

- Shared glossaries and terminology databases
- Translation memory (reuse across projects)
- Quality gates (review required before merge)
- Analytics (translation coverage dashboards)

---

## 7. Configuration Approach

### Project-Level Config (`.translation-sync.json`)

```json
{
  "sourceLanguage": "en",
  "sourceFile": "src/i18n/en.json",
  "targetLanguages": ["fr", "de", "es", "ja", "zh"],
  "format": "json",
  "keySort": "asc",
  "placeholderPatterns": ["{}", "{{}}", "${}"],
  "customInstructions": "Use formal tone for all languages. Technical terms should not be translated.",
  "modules": {
    "common": "src/i18n/{lang}/common.json",
    "admin": "src/i18n/{lang}/admin.json"
  }
}
```

### Natural Language Overrides

All config can be overridden via the command:

```
/translation-sync only French, formal tone, dry-run
/translation-sync src/i18n/en.json to all languages
/translation-sync staged changes only
```

### Auto-Discovery (Zero Config)

If no config exists, the skill scans the project and proposes a configuration — same as the extension's discover workflow, but conversational.

---

## 8. Competitive Landscape

| Tool | Type | Strengths | Weaknesses |
|------|------|-----------|------------|
| **i18next** | Library | Popular, many integrations | No AI translation |
| **Lokalise** | SaaS | Team features, TMS | Paid, vendor lock-in |
| **Crowdin** | SaaS | Community translation | Complex setup |
| **DeepL CLI** | CLI tool | High-quality translation | Paid API, no sync logic |
| **Copilot Translate** (ours) | VS Code ext | Smart sync, git-aware | VS Code only |
| **Translation Skill** (this) | Claude Skill | AI-native, universal, zero-dep | New, prompt-dependent |

### Our Differentiators

1. **AI-native sync** — not just translate, but intelligently sync (diff, reuse, merge)
2. **Zero external dependencies** — Claude is the translator, no API keys needed
3. **Universal** — works in any editor, CI/CD, or terminal
4. **Context-aware** — reads your code to understand how translations are used
5. **Conversational** — configure via natural language, not config files
6. **Full lifecycle** — extract → translate → sync → review → maintain (competitors only do one piece)
7. **Open source** — community-driven, extensible

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| **Plugin installs** | 500+ in first 3 months |
| **Translation accuracy** | Comparable to DeepL/Google Translate |
| **Sync reliability** | 99%+ correct file output (no data loss, no broken JSON) |
| **Time to first sync** | < 2 minutes from install to first successful sync |
| **Languages supported** | All BCP-47 codes (100+) |
| **Formats supported** | JSON, YAML, PO, XLIFF, ARB, Properties |
| **User satisfaction** | 4.5+ stars on marketplace |

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude produces malformed JSON | Medium | High | Use helper scripts for JSON writing; validate before save |
| Large files exceed context | Low | High | Chunk processing; file-by-file streaming |
| Non-deterministic behavior | Medium | Medium | Precise instructions; validation scripts; dry-run by default for first run |
| Marketplace rejection | Low | High | Follow Anthropic guidelines; thorough testing |
| Low adoption | Medium | Medium | Good docs; demo videos; comparison with alternatives |
| Breaking changes in skill API | Low | Medium | Pin to stable APIs; abstract skill internals |

---

## 11. What We're NOT Building

Clarity on scope is as important as ambition. The skill is **not**:

- **A translation management system (TMS)** — No web UI, no role-based access, no approval workflows. Tools like Lokalise and Crowdin own that space.
- **A machine translation API** — We don't expose a general-purpose translation endpoint. The skill operates on *files in your project*.
- **A replacement for human translators** — For production apps with nuanced brand voice, the skill is a first pass and maintenance tool. Professional review may still be needed.
- **A real-time service** — No file watchers, no WebSocket connections. It runs on-demand or on schedule.

---

## 12. Next Steps

1. **Scaffold the plugin structure** — `.claude-plugin/plugin.json`, skill directories
2. **Write the core skill** — `/translation-sync` SKILL.md with full instructions
3. **Write supporting skills** — `/translation-health`, `/translation-extract`, `/translation-review`
4. **Build helper scripts** — JSON diff, placeholder validation, safe merge
5. **Test locally** — Run against real translation projects
6. **Iterate on reliability** — Tighten instructions, add edge case handling
7. **Write documentation** — README, examples, configuration guide
8. **Submit to marketplace** — Package and publish

---

*This document is the north star for the translation-skill project. It will evolve as we build, test, and learn from user feedback.*
