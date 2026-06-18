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
      // ==================== FEATURES ====================
      { text: 'feat: Add Doovy.ts machine learning engine', category: 'FEATURES' as const },
      { text: 'feat: Add shellExec.ts for native command execution', category: 'FEATURES' as const },
      { text: 'feat: Add security checker to action.yml workflow', category: 'FEATURES' as const },
      { text: 'feat: Add copyright header verification system', category: 'FEATURES' as const },
      { text: 'feat: Add detect trigger mechanism for repository events', category: 'FEATURES' as const },
      { text: 'feat: Add calculate hash logic for file integrity', category: 'FEATURES' as const },
      { text: 'feat: Add push-engine.ts core module development', category: 'FEATURES' as const },
      { text: 'feat: Add index.ts export routing infrastructure', category: 'FEATURES' as const },
      { text: 'feat: Added word order understanding feature with ngrams', category: 'FEATURES' as const },
      { text: 'feat: Add on-the-fly compile runtime support', category: 'FEATURES' as const },
      { text: 'implement lightvm core bytecode executor architecture', category: 'FEATURES' as const },
      { text: 'feat: support multi-tenant database connection routing', category: 'FEATURES' as const },
      { text: 'feat: implement oauth2 login flow with google provider', category: 'FEATURES' as const },
      { text: 'feat: add support for webauthn biometric authentication', category: 'FEATURES' as const },
      { text: 'feat: create dynamic dashboard widgets layout renderer', category: 'FEATURES' as const },
      { text: 'feat: implement automatic database migration runner on startup', category: 'FEATURES' as const },
      { text: 'feat: add native compression middleware support for response streams', category: 'FEATURES' as const },
      { text: 'feat: introduce realtime notification engine using websocket server', category: 'FEATURES' as const },
      { text: 'feat: implement rate limiting controller via redis memory cache', category: 'FEATURES' as const },
      { text: 'feat(auth): support session revocation token list validation', category: 'FEATURES' as const },
      { text: 'feat(api): expose query parameter metrics for performance analysis', category: 'FEATURES' as const },
      { text: 'feat: add dark mode theme palette provider context', category: 'FEATURES' as const },
      { text: 'feat: support markdown parsing engine inside rich text editor component', category: 'FEATURES' as const },
      { text: 'feat: implement file upload processing stream chunks directly to s3 storage', category: 'FEATURES' as const },
      { text: 'feat: introduce high performance bulk insertion framework for telemetry logs', category: 'FEATURES' as const },
      { text: 'feat: support custom syntax configuration rules file loading', category: 'FEATURES' as const },
      { text: 'feat: add automated email notification layout builder tool', category: 'FEATURES' as const },
      { text: 'feat: implement hardware acceleration flags validation utility', category: 'FEATURES' as const },
      { text: 'feat: add background worker queue state monitor module', category: 'FEATURES' as const },
      { text: 'feat: implement incremental build mode options for fast development execution', category: 'FEATURES' as const },

      // ==================== BUG_FIXES ====================
      { text: 'fix: Fix not exist tag error inside git engine', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix shellExec error msg not showing on output terminal', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix tag commit SHA error calculation mismatch', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix sync issues between remote and local pipeline', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix security checker boundary conditions vulnerabilities', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix cache logic storage path directory mismatch', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix install-compile.sh execution permission crash', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix sed-engine.sh syntax substitution bug', category: 'BUG_FIXES' as const },
      { text: 'fix: comment respons string formatting parsing leak', category: 'BUG_FIXES' as const },
      { text: 'fix: Fixed version writing inside automated text writer', category: 'BUG_FIXES' as const },
      { text: 'fix: Fix NEW_VERSION bug variable tracking state override', category: 'BUG_FIXES' as const },
      { text: 'fix: resolve unhandled promise rejection during connection timeout failure', category: 'BUG_FIXES' as const },
      { text: 'fix: patch memory leak in event emitter listeners lookup maps', category: 'BUG_FIXES' as const },
      { text: 'fix: prevent null pointer reference crash inside semantic syntax validator', category: 'BUG_FIXES' as const },
      { text: 'fix: resolve deadlock blocking state in database transaction pool management', category: 'BUG_FIXES' as const },
      { text: 'fix: fix broken responsive layout styling rules on mobile chrome browser view', category: 'BUG_FIXES' as const },
      { text: 'fix: hotfix to filter out invalid authorization credentials tokens block', category: 'BUG_FIXES' as const },
      { text: 'fix: resolve infinite loop execution during nested array serialization processes', category: 'BUG_FIXES' as const },
      { text: 'fix: fix type mapping collision failure inside compiler configuration options', category: 'BUG_FIXES' as const },
      { text: 'fix: prevent unexpected stack overflow boundary errors during deep recursion paths', category: 'BUG_FIXES' as const },
      { text: 'fix(core): patch vulnerability validation schema checks mechanisms', category: 'BUG_FIXES' as const },
      { text: 'fix(ui): correct modal dialog transition backdrop z-index placement stack', category: 'BUG_FIXES' as const },
      { text: 'fix: escape dangerous characters to mitigate cross site scripting injection vectors', category: 'BUG_FIXES' as const },
      { text: 'fix: catch file descriptor leak anomalies across active socket network streams', category: 'BUG_FIXES' as const },
      { text: 'fix: restore corrupted session parameters during unexpected disconnect cycles', category: 'BUG_FIXES' as const },
      { text: 'fix: fix environmental variable fallback definitions overriding production states', category: 'BUG_FIXES' as const },
      { text: 'fix: resolve thread synchronization racing anomalies inside logging loop systems', category: 'BUG_FIXES' as const },
      { text: 'fix: correct bad offset calculation formula reading binary blob allocations', category: 'BUG_FIXES' as const },
      { text: 'fix: prevent cross origin cors blocker errors on dynamic file distribution points', category: 'BUG_FIXES' as const },
      { text: 'fix: patch broken date format representation across alternative server locales', category: 'BUG_FIXES' as const },

      // ==================== MAINTENANCE ====================
      { text: 'docs: Add CHANGELOG.md release documentation', category: 'MAINTENANCE' as const },
      { text: 'chore: Add release.yml github action automatic workflow', category: 'MAINTENANCE' as const },
      { text: 'chore: Add scripts directories for asset processing automation', category: 'MAINTENANCE' as const },
      { text: 'update Doovy AI parameters and model internal properties', category: 'MAINTENANCE' as const },
      { text: 'refactor: Clean up code complexity inside semantic optimizer', category: 'MAINTENANCE' as const },
      { text: 'feat: Update Doovy dataset vocabulary limits for tuning', category: 'MAINTENANCE' as const },
      { text: 'chore: Setup prettier format rules configuration styling', category: 'MAINTENANCE' as const },
      { text: 'chore: Update types declaration definitions interfaces', category: 'MAINTENANCE' as const },
      { text: 'refactor: Tidy up the log step code structure sequence', category: 'MAINTENANCE' as const },
      { text: 'chore: Tidying up the code and clearing unused imports', category: 'MAINTENANCE' as const },
      { text: 'feat: Update push-engine log msg format styling lines', category: 'MAINTENANCE' as const },
      { text: 'feat: Update action.yml metadata properties parameters', category: 'MAINTENANCE' as const },
      { text: 'chore: Update package.json scripts run and target versions', category: 'MAINTENANCE' as const },
      { text: 'chore: bump dependencies version parameters to comply with upstream patches', category: 'MAINTENANCE' as const },
      { text: 'docs: update markdown documentation setup guide detailing deployment tutorials', category: 'MAINTENANCE' as const },
      { text: 'refactor: decouple network routing adapters architecture layer completely', category: 'MAINTENANCE' as const },
      { text: 'chore: configure strict eslint tracking parameters across root source folders', category: 'MAINTENANCE' as const },
      { text: 'perf: optimize internal payload serialization performance speeds throughput', category: 'MAINTENANCE' as const },
      { text: 'test: expand unit test assertions coverage limits validating server routines', category: 'MAINTENANCE' as const },
      { text: 'chore: clean up obsolete temporary artifact tracks inside gitignore profiles', category: 'MAINTENANCE' as const },
      { text: 'refactor: simplify deeply nested conditional evaluation statements logic structures', category: 'MAINTENANCE' as const },
      { text: 'docs: fix grammatical typo mistakes across API reference documentation pages', category: 'MAINTENANCE' as const },
      { text: 'chore(ci): split test running tasks across parallel cloud workers setups', category: 'MAINTENANCE' as const },
      { text: 'style: normalize code blocks indentation rules and trailing space behaviors', category: 'MAINTENANCE' as const },
      { text: 'perf: rewrite inner math computation loop using lookup tables cache arrays', category: 'MAINTENANCE' as const },
      { text: 'chore: migrate old configuration manifests structures to updated schema models', category: 'MAINTENANCE' as const },
      { text: 'refactor: rename abstract factory base interfaces eliminating token ambiguity', category: 'MAINTENANCE' as const },
      { text: 'chore: audit corporate license header stamps compliance across package trees', category: 'MAINTENANCE' as const },
      { text: 'test: add integration benchmark testing coverage checking worker pooling strain', category: 'MAINTENANCE' as const },
      { text: 'chore: prune deprecated helper wrappers routines legacy methods files', category: 'MAINTENANCE' as const },
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
