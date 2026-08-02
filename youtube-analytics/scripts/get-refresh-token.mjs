#!/usr/bin/env node
/**
 * 初回だけローカルPCで実行して、YouTube Analytics 用のリフレッシュトークンを取得します。
 *
 *   YT_CLIENT_ID=xxx YT_CLIENT_SECRET=yyy node scripts/get-refresh-token.mjs
 *
 * ブラウザで Google のログイン画面が開くので、分析したいチャンネルの Google アカウントで
 * 許可してください。最後に表示されたリフレッシュトークンを GitHub Secrets の
 * YT_REFRESH_TOKEN に登録します。
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const PORT = 8788;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = [
	'https://www.googleapis.com/auth/yt-analytics.readonly',
	'https://www.googleapis.com/auth/youtube.readonly'
];

const clientId = process.env.YT_CLIENT_ID;
const clientSecret = process.env.YT_CLIENT_SECRET;

if (!clientId || !clientSecret) {
	console.error('YT_CLIENT_ID と YT_CLIENT_SECRET を環境変数で渡してください。');
	process.exit(1);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
	client_id: clientId,
	redirect_uri: REDIRECT_URI,
	response_type: 'code',
	scope: SCOPES.join(' '),
	access_type: 'offline',
	prompt: 'consent'
})}`;

const exchangeCode = async (code) => {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});
	const payload = await response.json();
	if (!response.ok) {
		throw new Error(payload.error_description ?? payload.error ?? '不明なエラー');
	}
	return payload;
};

const server = createServer(async (request, response) => {
	const url = new URL(request.url, REDIRECT_URI);
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end(`認可がキャンセルされました: ${error}`);
		server.close();
		process.exit(1);
	}
	if (!code) {
		response.writeHead(404).end();
		return;
	}

	try {
		const tokens = await exchangeCode(code);
		response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		response.end('<h1>完了しました</h1><p>ターミナルに戻ってください。</p>');
		console.log('\n=========================================================');
		console.log('YT_REFRESH_TOKEN:');
		console.log(tokens.refresh_token ?? '(取得できませんでした)');
		console.log('=========================================================');
		if (!tokens.refresh_token) {
			console.log(
				'\nrefresh_token が空の場合は、Google アカウントの「サードパーティ アクセス」から'
			);
			console.log('このアプリの許可を解除してから、もう一度実行してください。');
		}
		server.close();
		process.exit(tokens.refresh_token ? 0 : 1);
	} catch (caught) {
		response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end(`トークン交換に失敗しました: ${caught.message}`);
		console.error(caught.message);
		server.close();
		process.exit(1);
	}
});

server.listen(PORT, () => {
	console.log('ブラウザで次のURLを開いて許可してください:\n');
	console.log(authUrl);
	console.log('');
	const opener =
		process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
	spawn(opener, [authUrl], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' })
		.on('error', () => {})
		.unref();
});
