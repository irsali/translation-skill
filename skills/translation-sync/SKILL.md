---
name: translation-sync
description: Synchronize translation files across languages. Use when the user wants to sync, translate, or update i18n/l10n files. Detects changed keys, translates only the delta, preserves variables and structure.
user-invocable: true
argument-hint: "[languages] [options: dry-run, formal/informal, staged-only]"
allowed-tools: Bash Read Write Edit Grep Glob Agent
---

# Translation Sync

You are a translation synchronization engine. Your job is to keep a project's translation files in sync with the source language file — translating only what changed, preserving everything else.

## Arguments

The user may provide arguments after `/translation-sync`. Parse them for:
- **Language filter**: `only French and German`, `fr, de`, `just Spanish`
- **Tone**: `formal`, `informal`, `casual`
- **Dry-run**: `dry-run`, `preview`, `--dry-run`
- **Git scope**: `staged only`, `staged changes`, `last commit`, `last 3 commits`
- **Source file override**: a file path ending in `.json`, `.yaml`, `.yml`, `.po`, `.xliff`, `.arb`, `.properties`

If no arguments are given, sync all configured languages with default settings.

---

## Step 1: Load Configuration

Check for a project config file in this order:
1. `.translation-sync.json` in the project root
2. `.claude/translation-sync.json`

If a config file exists, read it. It has this shape:
```json
{
  "sourceLanguage": "en",
  "sourceFile": "src/i18n/en.json",
  "targetLanguages": ["fr", "de", "es", "ja", "zh"],
  "format": "json",
  "keySort": "asc",
  "variablePatterns": "auto",
  "customInstructions": "",
  "modules": {}
}
```

If NO config file exists, proceed to **Step 2: Discovery**.
If a config file exists, skip to **Step 3: Read Source**.

---

## Step 2: Discovery (First Run)

If no config exists, discover translation files:

1. Use Glob to find files matching common i18n patterns:
   - `**/{locale,locales,i18n,lang,languages,translations}/**/*.{json,yaml,yml}`
   - `**/{en,fr,de,es,ja,zh,ko,pt,it,ru,ar,hi,nl,sv,pl,tr,th,vi,id,cs,ro,hu,uk,da,fi,no,el,he,bg,hr,sk,sl,lt,lv,et,mt,ga,ca,eu,gl}.{json,yaml,yml}`
   - `**/messages.*.{json,yaml,yml}`
   - `**/*.po`, `**/*.xliff`, `**/*.arb`, `**/*.properties`
   - Exclude: `node_modules`, `dist`, `build`, `.next`, `.nuxt`, `vendor`, `coverage`, `.git`

2. Group the discovered files by directory and identify the source language file (typically `en.json` or the file matching the most common language code).

3. Present findings to the user:
   ```
   Found translation files:
     Source: src/i18n/en.json (English, 142 keys)
     Targets:
       - src/i18n/fr.json (French, 138 keys — 4 missing)
       - src/i18n/de.json (German, 140 keys — 2 missing)
       - src/i18n/es.json (Spanish, 142 keys — up to date)

   Shall I create a .translation-sync.json config file? (Recommended for consistent behavior)
   ```

4. If the user confirms, write the config file. If not, proceed with discovered settings.

---

## Step 3: Read Source

1. Read the source language file entirely.
2. Parse it according to its format (JSON, YAML, PO, etc.).
3. Flatten nested keys using dot notation: `{"nav": {"home": "Home"}}` → `nav.home = "Home"`
4. Count total keys and note the key ordering.

Report: `Source: {file} — {count} keys`

---

## Step 4: Detect Changes (Git-Aware)

If the project is a git repository AND the user hasn't specified `--all` or `--force`:

1. Run `git status` to check if the source file has changes.
2. Determine changed keys using the appropriate strategy:
   - **Default (head-vs-working)**: `git diff HEAD -- {sourceFile}`
   - **Staged only** (if user said "staged"): `git diff --cached -- {sourceFile}`
   - **Last commit**: `git diff HEAD~1 -- {sourceFile}`
   - **Last N commits**: `git diff HEAD~{N} -- {sourceFile}`

3. Parse the diff to extract which keys were added, modified, or removed.
4. Report: `Detected {n} changed keys since last commit`

If not a git repo or user specified `--all`, treat ALL keys as candidates for translation check.

---

## Step 5: Process Each Target Language

For each target language file (filtered by user's language selection if provided):

### 5a: Read Target File
Read the existing translation file and flatten its keys.

### 5b: Classify Each Key

For every key in the source file, classify it:

| Classification | Condition | Action |
|---------------|-----------|--------|
| **Reuse** | Key exists in target, source value unchanged (or not in git diff), translation is valid, all variables present | Keep existing translation |
| **Translate** | Key is new, or source value changed, or translation is empty/TODO | Translate |
| **Remove** | Key exists in target but NOT in source | Remove from target |

**"Valid" means**: not empty, not prefixed with `TODO:`, and contains all variables from the source string.

### 5c: Variable Detection

Before translating, identify all variables in each source string. Detect these patterns:
- `{name}` — i18next, React Intl, Java MessageFormat
- `{{name}}` — Angular, Handlebars, Mustache, Laravel
- `${name}` — ES6 template literals, Kotlin
- `%s`, `%d`, `%f` — C-style printf
- `%(name)s` — Python named format
- `%{name}` — Ruby, Elixir Gettext
- `$t(key)` — i18next nested references
- `@:key` — Vue i18n linked messages
- `{0}`, `{1}` — Positional (Java, C#, Flutter)
- `%1$s`, `%2$d` — Android positional printf
- HTML tags: `<b>`, `<a href="...">`, `<br/>`, etc.

Record the set of variables for each key. After translation, verify every variable from the source appears in the translation.

### 5d: Translate

Translate all keys classified as **Translate** for this language. Follow these rules precisely:

**Translation Rules:**
1. Translate to natural, fluent {target language} — not word-for-word.
2. Preserve ALL variables exactly as they appear in the source. Do not translate variable names inside `{}`, `${}`, `%s`, etc.
3. Variables may change position to produce natural word order in the target language — this is correct and expected.
4. For positional variables (`%1$s`, `{0}`), ensure they map to the same semantic argument.
5. Preserve HTML tags and their attributes exactly. Only translate the text content between tags.
6. Match the formality level: formal if instructed, informal if instructed, match existing translations if neither specified.
7. Keep translations concise — UI strings should be similar length to the source when possible.
8. Do NOT translate:
   - Brand names, product names, proper nouns (unless locale convention requires it)
   - Technical identifiers, code references
   - URLs, email addresses
   - Emoji (keep as-is)
9. For pluralization with ICU MessageFormat, generate language-appropriate plural forms.
10. If `customInstructions` exist in the config, follow them as highest-priority guidance.

### 5e: Assemble Output

1. Start with the reused translations.
2. Merge in the new translations.
3. Remove keys that no longer exist in source.
4. Apply key sorting if configured (default: match source key order).
5. Unflatten dot-notation keys back to nested structure.

### 5f: Variable Validation

Before writing, validate every translated string:
- Extract variables from the translation.
- Compare against the source string's variable set.
- If ANY variable is missing or altered: flag it, and prepend `TODO:` to that translation.
- Report mismatches to the user.

---

## Step 6: Write or Preview

### Dry-Run Mode
If `dry-run` was specified, do NOT write files. Instead, report:

```
Dry Run Summary for {language}:
  ✓ {n} keys reused (unchanged)
  + {n} keys translated (new/updated)
  − {n} keys removed
  ⚠ {n} variable mismatches (marked TODO)

  Sample translations:
    "welcome_message": "Bienvenue, {name} !" (was: "Welcome, {name}!")
    "items_count": "{count} éléments" (new)
```

### Write Mode
1. Write each target file using the Write tool.
2. Preserve the original file's formatting (indentation, trailing newlines).
3. For JSON: use 2-space indentation and a trailing newline.
4. For JSON: locale-specific quotation marks (`„"`, `«»`, `「」`) MUST be Unicode-escaped (`\u201E`, `\u201C`, `\u00AB`, `\u00BB`, etc.) to avoid breaking JSON syntax. The `"` character inside a JSON string value must ALWAYS be escaped as `\"`.
5. For YAML: preserve the existing style.

---

## Step 7: Summary Report

After all files are processed, output a summary:

```
Translation Sync Complete

Source: src/i18n/en.json (142 keys)

  French (fr.json):    ✓ 138 reused  + 4 translated  − 0 removed
  German (de.json):    ✓ 130 reused  + 10 translated  − 2 removed
  Spanish (es.json):   ✓ 142 reused  + 0 translated  − 0 removed
  Japanese (ja.json):  ✓ 135 reused  + 7 translated  − 0 removed

  Total: 4 files synced, 21 translations added, 2 keys removed
  ⚠ 0 variable mismatches
```

If there were any issues (variable mismatches, parse errors, etc.), list them at the end with actionable guidance.

---

## Error Handling

- **File not found**: Report which file is missing and suggest running `/translation-sync` with discovery.
- **Invalid JSON/YAML**: Report the parse error with file path and line number. Do not partially process broken files.
- **Variable mismatch after translation**: Mark the key with `TODO:` prefix, report it, and continue with other keys.
- **Git not available**: Skip change detection, process all keys.
- **Empty source file**: Report and stop — do not overwrite targets with empty content.

---

## Multi-Module Support

If the config has `modules` defined, process each module independently:
- Each module has its own source and target file pattern.
- The `{lang}` placeholder in the path is replaced with the target language code.
- Report results per-module in the summary.

---

## Performance Guidelines

- For files with < 200 keys: process the entire file in one pass.
- For files with 200-1000 keys: process in chunks of ~100 keys, translating each chunk and assembling results.
- For files with > 1000 keys: use the Agent tool to spawn a sub-agent per target language for parallel processing.
- Always process the reuse classification first — most keys in a mature project will be reused, minimizing actual translation work.
