#!/usr/bin/env node
/**
 * YouTube Analytics API v2 からチャンネルの分析データを取得し、
 * Evidence が読む CSV（sources/youtube/*.csv）に書き出します。
 *
 * 必要な環境変数:
 *   YT_CLIENT_ID      Google Cloud の OAuth クライアントID
 *   YT_CLIENT_SECRET  同シークレット
 *   YT_REFRESH_TOKEN  リフレッシュトークン（scripts/get-refresh-token.mjs で取得）
 * 任意:
 *   YT_DAYS           取得する日数（既定: 90）
 *   YT_END_DATE       集計の最終日 YYYY-MM-DD（既定: 3日前。分析データは数日遅れて確定するため）
 *
 * 取得できなかった場合は非ゼロで終了します。CI 側では既存の CSV を
 * そのまま使ってビルドを続行できるようにしてあります。
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeCsv } from './lib/csv.mjs';
import {
	ageGroupLabel,
	countryLabel,
	deviceLabel,
	genderLabel,
	trafficSourceLabel
} from './lib/labels.mjs';

const SOURCE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'sources', 'youtube');
const ANALYTICS_ENDPOINT = 'https://youtubeanalytics.googleapis.com/v2/reports';
const DATA_API_ENDPOINT = 'https://www.googleapis.com/youtube/v3';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const requireEnv = (name) => {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`環境変数 ${name} が設定されていません。README の「セットアップ」を参照してください。`
		);
	}
	return value;
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const shiftDays = (dateString, days) => {
	const date = new Date(`${dateString}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return toDateString(date);
};

/** リフレッシュトークンを使ってアクセストークンを取得する */
const getAccessToken = async () => {
	const response = await fetch(TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: requireEnv('YT_CLIENT_ID'),
			client_secret: requireEnv('YT_CLIENT_SECRET'),
			refresh_token: requireEnv('YT_REFRESH_TOKEN'),
			grant_type: 'refresh_token'
		})
	});
	const payload = await response.json();
	if (!response.ok) {
		throw new Error(
			`アクセストークンの取得に失敗しました (${response.status}): ${payload.error_description ?? payload.error ?? '不明なエラー'}`
		);
	}
	return payload.access_token;
};

const callApi = async (url, accessToken) => {
	const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
	const payload = await response.json();
	if (!response.ok) {
		const message = payload?.error?.message ?? JSON.stringify(payload);
		throw new Error(`API 呼び出しに失敗しました (${response.status}): ${message}`);
	}
	return payload;
};

/**
 * Analytics API のレスポンスは columnHeaders + rows の配列なので、
 * 扱いやすいオブジェクトの配列に変換する。
 */
const toRecords = (payload) => {
	const columns = (payload.columnHeaders ?? []).map((header) => header.name);
	return (payload.rows ?? []).map((row) =>
		Object.fromEntries(columns.map((column, index) => [column, row[index]]))
	);
};

const runReport = async (accessToken, { startDate, endDate, metrics, dimensions, sort, maxResults }) => {
	const params = new URLSearchParams({
		ids: 'channel==MINE',
		startDate,
		endDate,
		metrics: metrics.join(',')
	});
	if (dimensions) params.set('dimensions', dimensions.join(','));
	if (sort) params.set('sort', sort);
	if (maxResults) params.set('maxResults', String(maxResults));
	return toRecords(await callApi(`${ANALYTICS_ENDPOINT}?${params}`, accessToken));
};

/** 動画IDだけでは何の動画か分からないので、Data API でタイトル等を引く */
const fetchVideoDetails = async (accessToken, videoIds) => {
	const details = new Map();
	for (let index = 0; index < videoIds.length; index += 50) {
		const batch = videoIds.slice(index, index + 50);
		const params = new URLSearchParams({ part: 'snippet,contentDetails', id: batch.join(',') });
		const payload = await callApi(`${DATA_API_ENDPOINT}/videos?${params}`, accessToken);
		for (const item of payload.items ?? []) {
			details.set(item.id, {
				title: item.snippet?.title ?? item.id,
				published_at: item.snippet?.publishedAt?.slice(0, 10) ?? '',
				duration: item.contentDetails?.duration ?? ''
			});
		}
	}
	return details;
};

const fetchChannelInfo = async (accessToken) => {
	const params = new URLSearchParams({ part: 'snippet,statistics', mine: 'true' });
	const payload = await callApi(`${DATA_API_ENDPOINT}/channels?${params}`, accessToken);
	const channel = payload.items?.[0];
	if (!channel) throw new Error('チャンネル情報を取得できませんでした。');
	return {
		channel_id: channel.id,
		channel_title: channel.snippet?.title ?? '',
		total_subscribers: Number(channel.statistics?.subscriberCount ?? 0),
		total_views: Number(channel.statistics?.viewCount ?? 0),
		total_videos: Number(channel.statistics?.videoCount ?? 0)
	};
};

/** ISO 8601 の再生時間（PT1H2M3S）を秒に直す */
const parseDurationSeconds = (duration) => {
	const match = /^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration ?? '');
	if (!match) return '';
	const [, hours = 0, minutes = 0, seconds = 0] = match;
	return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const main = async () => {
	const endDate = process.env.YT_END_DATE || shiftDays(toDateString(new Date()), -3);
	const days = Number(process.env.YT_DAYS || 90);
	const startDate = shiftDays(endDate, -(days - 1));

	console.log(`YouTube Analytics を取得します: ${startDate} 〜 ${endDate}`);
	const accessToken = await getAccessToken();

	const channel = await fetchChannelInfo(accessToken);
	console.log(`チャンネル: ${channel.channel_title}`);

	// 1) 日別の基本指標
	const daily = await runReport(accessToken, {
		startDate,
		endDate,
		dimensions: ['day'],
		metrics: [
			'views',
			'estimatedMinutesWatched',
			'averageViewDuration',
			'averageViewPercentage',
			'subscribersGained',
			'subscribersLost',
			'likes',
			'comments',
			'shares'
		],
		sort: 'day'
	});
	writeCsv(
		join(SOURCE_DIR, 'daily.csv'),
		[
			'day',
			'views',
			'estimated_minutes_watched',
			'average_view_duration',
			'average_view_percentage',
			'subscribers_gained',
			'subscribers_lost',
			'net_subscribers',
			'likes',
			'comments',
			'shares'
		],
		daily.map((row) => ({
			day: row.day,
			views: row.views,
			estimated_minutes_watched: row.estimatedMinutesWatched,
			average_view_duration: row.averageViewDuration,
			average_view_percentage: row.averageViewPercentage,
			subscribers_gained: row.subscribersGained,
			subscribers_lost: row.subscribersLost,
			net_subscribers: row.subscribersGained - row.subscribersLost,
			likes: row.likes,
			comments: row.comments,
			shares: row.shares
		}))
	);

	// 2) 動画別（上位50本）
	const videos = await runReport(accessToken, {
		startDate,
		endDate,
		dimensions: ['video'],
		metrics: [
			'views',
			'estimatedMinutesWatched',
			'averageViewDuration',
			'averageViewPercentage',
			'likes',
			'comments',
			'shares',
			'subscribersGained'
		],
		sort: '-views',
		maxResults: 50
	});
	const videoDetails = await fetchVideoDetails(
		accessToken,
		videos.map((row) => row.video)
	);
	writeCsv(
		join(SOURCE_DIR, 'videos.csv'),
		[
			'video_id',
			'title',
			'published_at',
			'duration_seconds',
			'url',
			'views',
			'estimated_minutes_watched',
			'average_view_duration',
			'average_view_percentage',
			'likes',
			'comments',
			'shares',
			'subscribers_gained'
		],
		videos.map((row) => {
			const detail = videoDetails.get(row.video) ?? {};
			return {
				video_id: row.video,
				title: detail.title ?? row.video,
				published_at: detail.published_at ?? '',
				duration_seconds: parseDurationSeconds(detail.duration),
				url: `https://www.youtube.com/watch?v=${row.video}`,
				views: row.views,
				estimated_minutes_watched: row.estimatedMinutesWatched,
				average_view_duration: row.averageViewDuration,
				average_view_percentage: row.averageViewPercentage,
				likes: row.likes,
				comments: row.comments,
				shares: row.shares,
				subscribers_gained: row.subscribersGained
			};
		})
	);

	// 3) 流入経路
	const traffic = await runReport(accessToken, {
		startDate,
		endDate,
		dimensions: ['insightTrafficSourceType'],
		metrics: ['views', 'estimatedMinutesWatched'],
		sort: '-views'
	});
	writeCsv(
		join(SOURCE_DIR, 'traffic_sources.csv'),
		['source_type', 'source_label', 'views', 'estimated_minutes_watched'],
		traffic.map((row) => ({
			source_type: row.insightTrafficSourceType,
			source_label: trafficSourceLabel(row.insightTrafficSourceType),
			views: row.views,
			estimated_minutes_watched: row.estimatedMinutesWatched
		}))
	);

	// 4) 国別
	const geography = await runReport(accessToken, {
		startDate,
		endDate,
		dimensions: ['country'],
		metrics: ['views', 'estimatedMinutesWatched', 'averageViewDuration'],
		sort: '-views',
		maxResults: 30
	});
	writeCsv(
		join(SOURCE_DIR, 'geography.csv'),
		['country_code', 'country_name', 'views', 'estimated_minutes_watched', 'average_view_duration'],
		geography.map((row) => ({
			country_code: row.country,
			country_name: countryLabel(row.country),
			views: row.views,
			estimated_minutes_watched: row.estimatedMinutesWatched,
			average_view_duration: row.averageViewDuration
		}))
	);

	// 5) デバイス別
	const devices = await runReport(accessToken, {
		startDate,
		endDate,
		dimensions: ['deviceType'],
		metrics: ['views', 'estimatedMinutesWatched'],
		sort: '-views'
	});
	writeCsv(
		join(SOURCE_DIR, 'devices.csv'),
		['device_type', 'device_label', 'views', 'estimated_minutes_watched'],
		devices.map((row) => ({
			device_type: row.deviceType,
			device_label: deviceLabel(row.deviceType),
			views: row.views,
			estimated_minutes_watched: row.estimatedMinutesWatched
		}))
	);

	// 6) 視聴者属性（年齢 × 性別）。チャンネル規模が小さいと空で返ることがある。
	let demographics = [];
	try {
		demographics = await runReport(accessToken, {
			startDate,
			endDate,
			dimensions: ['ageGroup', 'gender'],
			metrics: ['viewerPercentage'],
			sort: '-viewerPercentage'
		});
	} catch (error) {
		console.warn(`  視聴者属性は取得できませんでした: ${error.message}`);
	}
	writeCsv(
		join(SOURCE_DIR, 'demographics.csv'),
		['age_group', 'age_label', 'gender', 'gender_label', 'viewer_percentage'],
		demographics.map((row) => ({
			age_group: row.ageGroup,
			age_label: ageGroupLabel(row.ageGroup),
			gender: row.gender,
			gender_label: genderLabel(row.gender),
			viewer_percentage: row.viewerPercentage
		}))
	);

	// 7) レポートのメタ情報（生成時刻・期間・チャンネル累計）
	writeCsv(
		join(SOURCE_DIR, 'meta.csv'),
		[
			'generated_at',
			'start_date',
			'end_date',
			'channel_id',
			'channel_title',
			'total_subscribers',
			'total_views',
			'total_videos',
			'is_sample'
		],
		[
			{
				generated_at: new Date().toISOString(),
				start_date: startDate,
				end_date: endDate,
				...channel,
				is_sample: 'false'
			}
		]
	);

	console.log('取得が完了しました。');
};

main().catch((error) => {
	console.error(`\n[fetch-youtube] ${error.message}`);
	process.exit(1);
});
