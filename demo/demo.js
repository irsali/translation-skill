#!/usr/bin/env node
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (s) => process.stdout.write(s);

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  brightGreen: '\x1b[92m',
};

const PROMPT = `${C.brightGreen}❯${C.reset} `;

async function type(text, delay = 22) {
  for (const ch of text) {
    out(ch);
    await sleep(delay);
  }
}

async function main() {
  out(PROMPT);
  await type('git diff src/i18n/en.json');
  out('\n');
  await sleep(450);
  out(`${C.bold}diff --git a/src/i18n/en.json b/src/i18n/en.json${C.reset}\n`);
  out(`${C.gray}@@ -42,7 +42,7 @@${C.reset}\n`);
  out(`   "logout": "Sign out",\n`);
  out(`${C.red}-  "delete_confirm": "Are you sure?",${C.reset}\n`);
  out(`${C.green}+  "delete_confirm": "Are you sure you want to delete this?",${C.reset}\n`);
  out(`   "save": "Save",\n`);
  await sleep(1400);

  out('\n');
  out(PROMPT);
  await type(`${C.cyan}/translation-sync${C.reset}`);
  out('\n');
  await sleep(700);

  out(`\n${C.bold}Translation Sync${C.reset}\n`);
  await sleep(350);
  out(`Source: ${C.cyan}src/i18n/en.json${C.reset} — ${C.bold}142 keys${C.reset}\n`);
  await sleep(350);
  out(`${C.gray}Detected 1 changed key since last commit${C.reset}\n`);
  await sleep(700);
  out('\n');

  const langs = [
    ['French', 'fr'],
    ['German', 'de'],
    ['Spanish', 'es'],
    ['Japanese', 'ja'],
  ];
  for (const [name, code] of langs) {
    out(
      `  ${C.cyan}${name.padEnd(9)}${C.reset} (${code}.json):  ${C.green}✓ 141 reused${C.reset}  ${C.yellow}+ 1 translated${C.reset}\n`
    );
    await sleep(520);
  }
  await sleep(350);
  out(`\n${C.brightGreen}${C.bold}✓ 4 files synced, 4 translations added${C.reset}\n`);
  await sleep(1500);

  out('\n');
  out(PROMPT);
  await type('git diff src/i18n/fr.json');
  out('\n');
  await sleep(450);
  out(`${C.bold}diff --git a/src/i18n/fr.json b/src/i18n/fr.json${C.reset}\n`);
  out(`${C.gray}@@ -42,7 +42,7 @@${C.reset}\n`);
  out(`   "logout": "Se déconnecter",\n`);
  out(`${C.red}-  "delete_confirm": "Êtes-vous sûr ?",${C.reset}\n`);
  out(
    `${C.green}+  "delete_confirm": "Êtes-vous sûr de vouloir supprimer ceci ?",${C.reset}\n`
  );
  out(`   "save": "Enregistrer",\n`);
  await sleep(2200);
}

main();
