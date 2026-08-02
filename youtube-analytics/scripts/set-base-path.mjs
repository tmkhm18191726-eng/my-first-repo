#!/usr/bin/env node
/**
 * GitHub Pages では、このレポートは
 *   https://<ユーザー名>.github.io/<リポジトリ名>/youtube/
 * に配置されます。Evidence はビルド時に基準パスを知っている必要があるので、
 * evidence.config.yaml の deployment.basePath を CI から書き換えます。
 *
 *   node scripts/set-base-path.mjs            # GITHUB_REPOSITORY から自動判定
 *   node scripts/set-base-path.mjs /foo/bar   # 明示指定
 *   node scripts/set-base-path.mjs ""         # ルート配信に戻す
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'evidence.config.yaml');
const SUBDIRECTORY = '/youtube';

const resolveBasePath = () => {
	const explicit = process.argv[2];
	if (explicit !== undefined) return explicit;

	const repository = process.env.GITHUB_REPOSITORY;
	if (!repository) return '';

	const [owner, name] = repository.split('/');
	// <ユーザー名>.github.io というリポジトリはサイトのルートに配信されるため、
	// リポジトリ名をパスに含めてはいけない。
	const isUserSite = name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
	return isUserSite ? SUBDIRECTORY : `/${name}${SUBDIRECTORY}`;
};

const basePath = resolveBasePath();
if (basePath && !basePath.startsWith('/')) {
	console.error(`basePath は / で始まる必要があります: ${basePath}`);
	process.exit(1);
}

const config = readFileSync(CONFIG_PATH, 'utf8');
const updated = config.replace(/^(\s*)basePath:.*$/m, `$1basePath: "${basePath}"`);

if (updated === config && !config.includes(`basePath: "${basePath}"`)) {
	console.error('evidence.config.yaml に basePath の行が見つかりませんでした。');
	process.exit(1);
}

writeFileSync(CONFIG_PATH, updated, 'utf8');
console.log(`basePath を "${basePath}" に設定しました。`);
