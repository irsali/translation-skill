#!/usr/bin/env node

/**
 * Safe JSON merge with key ordering.
 *
 * Merges translated keys into a target file while preserving
 * structure and applying key sorting.
 *
 * Usage:
 *   node merge.js <target-file> <translations-json> [--sort asc|desc] [--source-order <source-file>]
 *
 * <translations-json> is a JSON string or file path of {key: translatedValue} pairs.
 *
 * Output: Writes the merged file to disk.
 */

const fs = require('fs');
const path = require('path');
const { flatten, unflatten } = require('./diff.js');

// --- Key sorting ---

function sortKeys(obj, order = 'asc', caseSensitive = false) {
  const sorted = {};
  const keys = Object.keys(obj).sort((a, b) => {
    const aKey = caseSensitive ? a : a.toLowerCase();
    const bKey = caseSensitive ? b : b.toLowerCase();
    const cmp = aKey.localeCompare(bKey);
    return order === 'desc' ? -cmp : cmp;
  });
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function applySourceKeyOrder(flatTarget, flatSource) {
  const ordered = {};

  // First, add keys in source order
  for (const key of Object.keys(flatSource)) {
    if (key in flatTarget) {
      ordered[key] = flatTarget[key];
    }
  }

  // Then, add any remaining target keys not in source (shouldn't happen after sync)
  for (const key of Object.keys(flatTarget)) {
    if (!(key in ordered)) {
      ordered[key] = flatTarget[key];
    }
  }

  return ordered;
}

// --- Merge logic ---

function mergeTranslations(existingFlat, newTranslations, removedKeys = []) {
  const merged = { ...existingFlat };

  // Apply new translations
  for (const [key, value] of Object.entries(newTranslations)) {
    merged[key] = value;
  }

  // Remove deleted keys
  for (const key of removedKeys) {
    delete merged[key];
  }

  return merged;
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node merge.js <target-file> <translations-json> [--sort asc|desc] [--source-order <source-file>]');
    process.exit(1);
  }

  const targetPath = args[0];
  const translationsArg = args[1];

  // Parse optional flags
  let sortOrder = null;
  let sourceOrderPath = null;
  let removedKeysArg = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--sort' && args[i + 1]) {
      sortOrder = args[++i];
    } else if (args[i] === '--source-order' && args[i + 1]) {
      sourceOrderPath = args[++i];
    } else if (args[i] === '--remove' && args[i + 1]) {
      removedKeysArg = args[++i];
    }
  }

  try {
    // Read existing target
    let existingFlat = {};
    if (fs.existsSync(targetPath)) {
      const existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      existingFlat = flatten(existing);
    }

    // Parse new translations
    let newTranslations;
    if (fs.existsSync(translationsArg)) {
      newTranslations = JSON.parse(fs.readFileSync(translationsArg, 'utf-8'));
    } else {
      newTranslations = JSON.parse(translationsArg);
    }

    // Parse removed keys
    const removedKeys = removedKeysArg
      ? JSON.parse(removedKeysArg)
      : [];

    // Merge
    let merged = mergeTranslations(existingFlat, newTranslations, removedKeys);

    // Apply ordering
    if (sourceOrderPath && fs.existsSync(sourceOrderPath)) {
      const sourceContent = JSON.parse(fs.readFileSync(sourceOrderPath, 'utf-8'));
      const sourceFlat = flatten(sourceContent);
      merged = applySourceKeyOrder(merged, sourceFlat);
    } else if (sortOrder) {
      merged = sortKeys(merged, sortOrder);
    }

    // Unflatten and write
    const output = unflatten(merged);
    const json = JSON.stringify(output, null, 2) + '\n';

    fs.writeFileSync(targetPath, json, 'utf-8');

    // Report
    const result = {
      file: targetPath,
      totalKeys: Object.keys(merged).length,
      newKeys: Object.keys(newTranslations).length,
      removedKeys: removedKeys.length,
      sorted: sortOrder || (sourceOrderPath ? 'source-order' : 'none'),
    };
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

module.exports = { sortKeys, applySourceKeyOrder, mergeTranslations };
