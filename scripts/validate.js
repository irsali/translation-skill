#!/usr/bin/env node

/**
 * Translation variable/placeholder validator.
 *
 * Validates that all variables in source strings are preserved
 * in their translations. Reports mismatches.
 *
 * Usage:
 *   node validate.js <source-file> <target-file>
 *
 * Output: JSON to stdout with validation results.
 */

const fs = require('fs');
const { flatten, extractVariables } = require('./diff.js');

// --- Validation ---

function validateTranslations(sourceFlat, targetFlat) {
  const results = {
    valid: [],
    mismatches: [],
    missing: [],
    empty: [],
    todo: [],
  };

  for (const [key, sourceValue] of Object.entries(sourceFlat)) {
    if (!(key in targetFlat)) {
      results.missing.push({ key, sourceValue });
      continue;
    }

    const targetValue = targetFlat[key];

    // Empty check
    if (!targetValue || (typeof targetValue === 'string' && targetValue.trim() === '')) {
      results.empty.push({ key, sourceValue });
      continue;
    }

    // TODO check
    if (typeof targetValue === 'string' && targetValue.startsWith('TODO:')) {
      results.todo.push({ key, sourceValue, targetValue });
      continue;
    }

    // Variable check
    const sourceVars = extractVariables(sourceValue);
    const targetVars = extractVariables(targetValue);

    const missingVars = sourceVars.filter(v => !targetVars.includes(v));
    const extraVars = targetVars.filter(v => !sourceVars.includes(v));

    if (missingVars.length > 0 || extraVars.length > 0) {
      results.mismatches.push({
        key,
        sourceValue,
        targetValue,
        sourceVars,
        targetVars,
        missingVars,
        extraVars,
      });
    } else {
      results.valid.push({ key });
    }
  }

  return {
    ...results,
    stats: {
      total: Object.keys(sourceFlat).length,
      valid: results.valid.length,
      mismatches: results.mismatches.length,
      missing: results.missing.length,
      empty: results.empty.length,
      todo: results.todo.length,
      coverage: Object.keys(sourceFlat).length > 0
        ? ((results.valid.length / Object.keys(sourceFlat).length) * 100).toFixed(1)
        : '0.0',
    },
  };
}

// --- HTML tag validation ---

function extractHtmlTags(str) {
  if (typeof str !== 'string') return [];
  const tags = str.match(/<\/?[a-zA-Z][^>]*>/g) || [];
  return tags.sort();
}

function validateHtmlTags(sourceValue, targetValue) {
  const sourceTags = extractHtmlTags(sourceValue);
  const targetTags = extractHtmlTags(targetValue);

  if (sourceTags.length !== targetTags.length) {
    return {
      valid: false,
      sourceTags,
      targetTags,
      message: `Tag count mismatch: source has ${sourceTags.length}, target has ${targetTags.length}`,
    };
  }

  const missingTags = sourceTags.filter(t => !targetTags.includes(t));
  if (missingTags.length > 0) {
    return {
      valid: false,
      sourceTags,
      targetTags,
      missingTags,
      message: `Missing tags in translation: ${missingTags.join(', ')}`,
    };
  }

  return { valid: true };
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node validate.js <source-file> <target-file>');
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

    const result = validateTranslations(sourceFlat, targetFlat);

    // Also run HTML tag validation on matched keys
    const htmlIssues = [];
    for (const [key, sourceValue] of Object.entries(sourceFlat)) {
      if (key in targetFlat && typeof sourceValue === 'string' && sourceValue.includes('<')) {
        const htmlResult = validateHtmlTags(sourceValue, targetFlat[key]);
        if (!htmlResult.valid) {
          htmlIssues.push({ key, ...htmlResult });
        }
      }
    }

    result.htmlIssues = htmlIssues;
    result.stats.htmlIssues = htmlIssues.length;

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

module.exports = { validateTranslations, extractHtmlTags, validateHtmlTags };
