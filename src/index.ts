/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { shellExec } from './utils/shellExec.js';
import { CommitClassifier } from './Doovy.js';

async function run() {
  try {
    const isComment = process.env.IS_COMMENT || '';
    const commentFound = process.env.COMMENT_FOUND || '';

    console.log('=== 1. SEARCHING LATEST TAG & ANCHOR COMMIT ===');
    let latestTag = '';

    try {
      
      latestTag = shellExec('git describe --tags --abbrev=0');
    } catch {
      
      console.log(
        'ℹ️ No tags found in repository history. Using initial fallback tag.',
      );
      latestTag = 'v0.1.0-proto.0';
    }
    console.log(`Latest tag found: ${latestTag}`);
    
    let tagCommitSha = '';
    if (latestTag !== 'v0.1.0-proto.0') {
      try {
        tagCommitSha = shellExec(`git rev-list -n 1 "${latestTag}"`);
      } catch {
        tagCommitSha = '';
      }
    }
    console.log(`Commit SHA for that tag: ${tagCommitSha}`);

    console.log('=== 2. FETCHING COMMITS FOR CURRENT RELEASE ===');
    let rawLog = '';
    if (!tagCommitSha) {
      rawLog = shellExec('git log --format="* %s"');
    } else {
      rawLog = shellExec(`git log --format="* %s" ${tagCommitSha}..HEAD`);
    }

    const rawLogLines = rawLog.split('\n').filter((line) => line.length > 0);
    const changelogCommitsArray = rawLogLines.filter((line) => {
      const regex1 =
        /^\* (Merge pull request|Merge branch|chore|docs|test|ci)(\([^)]+?\))?:/;

      const regex2 = /^\* Merge pull request #[0-9]+ from .*/;

      return !regex1.test(line) && !regex2.test(line);
    });

    const changelogCommits = changelogCommitsArray.join('\n');

    if (!changelogCommits || !/[^\s]/.test(changelogCommits)) {
      console.log('No feature or bugfix commits found. Skipping release PR!');
      process.exit(0);
    }

    if (!changelogCommits || !/[^\s]/.test(changelogCommits)) {
      console.log(
        'No feature or bugfix commits found. All new commits are minor maintenance (chore/docs/test/ci). Skipping release PR!',
      );
      process.exit(0);
    }

    if (!changelogCommits) {
      console.log(
        `No new commits found after tag ${latestTag}. Skipping release PR!`,
      );
      process.exit(0);
    }

    console.log('=== 3. PARSING COMMAND FROM PR ===');

    const cleanLatestTag = latestTag.replace(/^v/, '');

    const baseVersionMatch = cleanLatestTag.match(/^([^#-]+)/);
    const baseVersion = baseVersionMatch ? baseVersionMatch[1] : latestTag;

    const tagCounterMatch = cleanLatestTag.match(/\.([0-9]+)$/);
    const tagCounter =
      tagCounterMatch && /^[0-9]+$/.test(tagCounterMatch[1])
        ? parseInt(tagCounterMatch[1], 10)
        : 0;

    const currentCommit = shellExec('git rev-parse HEAD');

    const prNumber = shellExec(
      `gh pr list --state merged --search "${currentCommit}" --json number -q '.[0].number'`,
    );

    let command = '';
    const commandRegex =
      /@domloo-release (major|minor|patch|proto|alpha|beta|rc|stable|set [0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]*)?)/;

    if (isComment === 'true') {
      const match = commentFound.match(commandRegex);
      if (match) command = match[0];
    } else if (prNumber) {
      const prBody = shellExec(
        `gh pr view "${prNumber}" --json body -q '.body'`,
      );
      const match = prBody.match(commandRegex);
      if (match) command = match[0];
    }

    let fullType = command || '@domloo-release alpha';

    const matchGroup = fullType.match(
      /@domloo-release (major|minor|patch|proto|alpha|beta|rc|stable|set \S+)/,
    );

    let type = matchGroup ? matchGroup[1].trim() : 'alpha';

    console.log(`[Domloo Debug] Parsed Command Type: "${type}"`);

    const versionParts = baseVersion.replace(/^v/, '').split('.');
    const major = parseInt(versionParts[0], 10) || 0;
    const minor = parseInt(versionParts[1], 10) || 0;
    const patch = parseInt(versionParts[2], 10) || 0;

    let nextVersion = '';
    let versionBase = '';

    const cleanBase = (tag: string, pattern: RegExp) => {
      return tag.replace(pattern, '').replace(/^v/, '');
    };

    if (type === 'major') {
      nextVersion = `${major + 1}.0.0`;
    } else if (type === 'minor') {
      nextVersion = `${major}.${minor + 1}.0`;
    } else if (type === 'patch') {
      nextVersion = `${major}.${minor}.${patch + 1}`;
    } else if (type === 'proto') {
      versionBase = cleanBase(cleanLatestTag, /-proto\.[0-9]+/);
      nextVersion = `${versionBase}-proto.${tagCounter + 1}`;
    } else if (type === 'alpha') {
      versionBase = cleanBase(cleanLatestTag, /-alpha\.[0-9]+/);
      nextVersion = `${versionBase}-alpha.${tagCounter + 1}`;
    } else if (type === 'beta') {
      versionBase = cleanBase(cleanLatestTag, /-beta\.[0-9]+/);
      nextVersion = `${versionBase}-beta.${tagCounter + 1}`;
    } else if (type === 'rc') {
      versionBase = cleanBase(cleanLatestTag, /-rc\.[0-9]+/);
      nextVersion = `${versionBase}-rc.${tagCounter + 1}`;
    } else if (type === 'stable') {
      nextVersion = cleanLatestTag.replace(/-.*/, '');
    } else if (type.startsWith('set')) {
      const setParts = type.split(/\s+/);
      nextVersion = setParts[1] || '';
    }

    core.exportVariable('NEW_VERSION', nextVersion);

    console.log('=== 2.5. TRAINING EMBEDDED NEURAL NETWORK ===');

    const trainingData = [
      // === FEATURES ===
      {
        text: 'add new feature for user authentication and login security',
        category: 'FEATURES' as const,
      },
      {
        text: 'implement lightvm core bytecode executor and interpreter architecture',
        category: 'FEATURES' as const,
      },
      {
        text: 'support new api endpoint for custom rom system telemetry',
        category: 'FEATURES' as const,
      },
      {
        text: 'create native bindings to support multi platform compilation',
        category: 'FEATURES' as const,
      },
      {
        text: 'add dark mode toggle inside layout ui components',
        category: 'FEATURES' as const,
      },
      {
        text: 'implement automated test runner framework for CI pipeline infrastructure',
        category: 'FEATURES' as const,
      },
      {
        text: 'introduce new analytics dashboard module to track panel metrics',
        category: 'FEATURES' as const,
      },
      {
        text: 'add multi language support for localization and i18n translation',
        category: 'FEATURES' as const,
      },
      {
        text: 'implement dynamic plugin engine loading architecture for modular extension',
        category: 'FEATURES' as const,
      },
      {
        text: 'add structural support for nested json scheme validation inside core parser',
        category: 'FEATURES' as const,
      },
      {
        text: 'create custom event emitter system to handle asynchronous internal calls',
        category: 'FEATURES' as const,
      },
      {
        text: 'integrate responsive dialog window layout for interactive player interface',
        category: 'FEATURES' as const,
      },
      {
        text: 'implement multi tier caching engine to reduce database read overhead',
        category: 'FEATURES' as const,
      },
      {
        text: 'add automatic file watcher system to handle hot reload changes',
        category: 'FEATURES' as const,
      },
      {
        text: 'introduce new cryptographic hashing method for user password protection',
        category: 'FEATURES' as const,
      },
      {
        text: 'implement standard bytecode instruction set verification inside system core',
        category: 'FEATURES' as const,
      },
      
      // === BUG_FIXES ===
      {
        text: 'fix null pointer exception error inside source syntax parser',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'resolve memory leak resources and unexpected runtime crash on exit',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'hotfix to handle invalid token auth and block secure connection',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix unexpected type error inside esbuild configuration bundle compiler',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'resolve infinite loop condition during virtual machine bytecode execution',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix race condition inside multi threading worker channel logic',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'patch security vulnerability inside core dependency library parser',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix broken ui rendering layout on mobile view android screen',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix unexpected runtime panic when passing empty array into internal function',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'resolve stack overflow error during recursive token parsing execution',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix variable scope lookup shadow bug inside bytecode compiler engine',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'patch integrity check failure when validation key mismatch occurs',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix file descriptor leaks caused by unclosed output stream pool',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'resolve dead lock block state inside state synchronization manager',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'fix environmental variable mapping error for production release tag output',
        category: 'BUG_FIXES' as const,
      },
      {
        text: 'hotfix for unexpected crash triggered by malformed binary bytecode stream',
        category: 'BUG_FIXES' as const,
      },
      
      // === MAINTENANCE ===
      {
        text: 'bump version for core dependencies and update github action configuration',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'clean up console log format and fix code styling via prettier lint rules',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'refactor routing logic architecture to clean up structural code change',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'update readme documentation and markdown changelog installation guide tutorial',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'optimize build process compile times and setup minification bundler scripts',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'compile source code and optimize automated assembly generator tools',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'improve performance profiling metrics during benchmark execution tests',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'ignore old backup temporary artifacts inside default gitignore template',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'refactor internal module structure to improve maintainability and clean import lines',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'update third party library license notices and headers format',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'optimize memory allocation strategy by reusing pre allocated buffer pool',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'clean up obsolete test files and deprecated helper class codebases',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'reorganize asset directories structure for public distribution optimization',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'migrate compile target to native bindings setup runner options',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'tweak confidence threshold rules inside automated script verification parameters',
        category: 'MAINTENANCE' as const,
      },
      {
        text: 'improve code coverage metrics by expanding units test assertion scope',
        category: 'MAINTENANCE' as const,
      },
    ];


    const classifier = new CommitClassifier();
    
    classifier.train(trainingData, 500);

    console.log('=== 2.6. CLASSIFYING COMMITS VIA NN ===');

    const properChangelogBody = classifier.generateChangelog(rawLogLines);

    const changelogContent = `## Changelog for ${nextVersion}\n\n${properChangelogBody}`;
    fs.writeFileSync('current_changelog.md', changelogContent, 'utf8');
  } catch (error: any) {
    core.setFailed(`Otak Bot Error: ${error.message}`);
  }
}

run();
