#!/usr/bin/env node

/**
 * Translation file diff engine.
 *
 * Compares a source translation file against a target file and reports
 * which keys need to be translated, reused, or removed.
 *
 * Usage:
 *   node diff.js <source-file> <target-file>
 *
 * Output: JSON to stdout with classified keys.
 */

const fs = require('fs');
const path = require('path');

// --- Flatten / Unflatten ---

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function unflatten(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

// --- Variable extraction ---

const VARIABLE_PATTERNS = [
  /\{[a-zA-Z_]\w*\}/g,                 // {name}
  /\{\{[a-zA-Z_]\w*\}\}/g,             // {{name}}
  /\$\{[a-zA-Z_]\w*\}/g,              // ${name}
  /%[sd]/g,                             // %s, %d
  /%\([a-zA-Z_]\w*\)[sd]/g,           // %(name)s
  /%\{[a-zA-Z_]\w*\}/g,               // %{name}
  /\$t\([^)]+\)/g,                      // $t(key)
  /@:[a-zA-Z_.]+/g,                     // @:key
  /\{\d+\}/g,                           // {0}, {1}
  /%\d+\$[sd]/g,                        // %1$s, %2$d
];

function extractVariables(str) {
  if (typeof str !== 'string') return [];
  const vars = new Set();
  for (const pattern of VARIABLE_PATTERNS) {
    const matches = str.match(pattern);
    if (matches) {
      matches.forEach(m => vars.add(m));
    }
  }
  return [...vars].sort();
}

// --- Diff logic ---

function diffTranslations(sourceFlat, targetFlat) {
  const reuse = {};
  const translate = {};
  const remove = {};
  const variableMismatches = [];

  // Keys in source
  for (const [key, sourceValue] of Object.entries(sourceFlat)) {
    if (key in targetFlat) {
      const targetValue = targetFlat[key];
      const sourceVars = extractVariables(sourceValue);
      const targetVars = extractVariables(targetValue);

      const isEmptyOrTodo =
        !targetValue ||
        (typeof targetValue === 'string' && targetValue.startsWith('TODO:'));

      const variablesMatch =
        sourceVars.length === targetVars.length &&
        sourceVars.every(v => targetVars.includes(v));

      if (!isEmptyOrTodo && variablesMatch) {
        reuse[key] = targetValue;
      } else {
        translate[key] = sourceValue;
        if (!variablesMatch && !isEmptyOrTodo) {
          variableMismatches.push({
            key,
            sourceVars,
            targetVars,
            missing: sourceVars.filter(v => !targetVars.includes(v)),
            extra: targetVars.filter(v => !sourceVars.includes(v)),
          });
        }
      }
    } else {
      translate[key] = sourceValue;
    }
  }

  // Keys in target but not in source
  for (const key of Object.keys(targetFlat)) {
    if (!(key in sourceFlat)) {
      remove[key] = targetFlat[key];
    }
  }

  return {
    reuse,
    translate,
    remove,
    variableMismatches,
    stats: {
      total: Object.keys(sourceFlat).length,
      reused: Object.keys(reuse).length,
      toTranslate: Object.keys(translate).length,
      toRemove: Object.keys(remove).length,
      mismatches: variableMismatches.length,
    },
  };
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node diff.js <source-file> <target-file>');
    process.exit(1);
  }

  const [sourcePath, targetPath] = args;

  try {
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const sourceFlat = flatten(sourceContent);

    let targetFlat = {};
    if (fs.existsSync(targetPath)) {
      const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      targetFlat = flatten(targetContent);
    }

    const result = diffTranslations(sourceFlat, targetFlat);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

module.exports = { flatten, unflatten, extractVariables, diffTranslations };
