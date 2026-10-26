import fs from 'node:fs';
import path from 'node:path';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface ParityIssue {
  key: string;
  type: 'MISSING_IN_AR' | 'MISSING_IN_EN' | 'PLACEHOLDER_MISMATCH' | 'TYPE_MISMATCH';
  details: string;
}

const PLACEHOLDER_REGEX = /\{([a-zA-Z0-9_]+)/g;

function extractPlaceholders(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    if (match[1]) {
      matches.push(match[1]);
    }
  }
  return matches.sort();
}

function traverseAndCompare(
  arObj: JsonObject,
  enObj: JsonObject,
  prefix = ''
): ParityIssue[] {
  const issues: ParityIssue[] = [];
  const arKeys = Object.keys(arObj);
  const enKeys = Object.keys(enObj);

  // Check keys in AR
  for (const key of arKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in enObj)) {
      issues.push({
        key: fullKey,
        type: 'MISSING_IN_EN',
        details: 'Key exists in Arabic but is missing in English',
      });
      continue;
    }

    const arVal = arObj[key];
    const enVal = enObj[key];

    const isArObj = typeof arVal === 'object' && arVal !== null && !Array.isArray(arVal);
    const isEnObj = typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal);

    if (isArObj && isEnObj) {
      issues.push(...traverseAndCompare(arVal as JsonObject, enVal as JsonObject, fullKey));
    } else if (typeof arVal === 'string' && typeof enVal === 'string') {
      const arPlaceholders = extractPlaceholders(arVal);
      const enPlaceholders = extractPlaceholders(enVal);

      if (arPlaceholders.join(',') !== enPlaceholders.join(',')) {
        issues.push({
          key: fullKey,
          type: 'PLACEHOLDER_MISMATCH',
          details: `Placeholders differ: AR=[${arPlaceholders.join(', ')}] vs EN=[${enPlaceholders.join(', ')}]`,
        });
      }
    } else if (typeof arVal !== typeof enVal) {
      issues.push({
        key: fullKey,
        type: 'TYPE_MISMATCH',
        details: `Type mismatch: AR is ${typeof arVal}, EN is ${typeof enVal}`,
      });
    }
  }

  // Check keys in EN missing in AR
  for (const key of enKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in arObj)) {
      issues.push({
        key: fullKey,
        type: 'MISSING_IN_AR',
        details: 'Key exists in English but is missing in Arabic',
      });
    }
  }

  return issues;
}

function main(): void {
  const messagesDir = path.resolve(process.cwd(), 'messages');
  const arPath = path.join(messagesDir, 'ar.json');
  const enPath = path.join(messagesDir, 'en.json');

  if (!fs.existsSync(arPath) || !fs.existsSync(enPath)) {
    console.error('Error: ar.json or en.json not found in messages directory.');
    process.exit(1);
  }

  const arMessages = JSON.parse(fs.readFileSync(arPath, 'utf8')) as JsonObject;
  const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf8')) as JsonObject;

  const issues = traverseAndCompare(arMessages, enMessages);

  if (issues.length > 0) {
    console.error(`\x1b[31m[i18n Parity Check Failed]\x1b[0m Found ${issues.length} parity issues:`);
    for (const issue of issues) {
      console.error(`  - [${issue.type}] ${issue.key}: ${issue.details}`);
    }
    process.exit(1);
  }

  console.log('\x1b[32m[i18n Parity Check Passed]\x1b[0m 100% key and placeholder parity between ar.json and en.json.');
}

main();
