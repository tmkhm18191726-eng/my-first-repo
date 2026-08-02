#!/usr/bin/env node
/**
 * 認証を設定する前でもレポートの見た目を確認できるように、
 * それらしいサンプルデータを sources/youtube/*.csv に生成します。
 *
 *   npm run sample
 *
 * 実データに差し替えるときは npm run fetch を実行してください（同じ CSV を上書きします）。
 * 乱数は固定シードなので、実行するたびに中身が変わることはありません。
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeCsv } from './lib/csv.mjs';
import { ageGroupLabel, countryLabel, deviceLabel, genderLabel, trafficSourceLabel } from './lib/labels.mjs';

const SOURCE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'sources', 'youtube');
const DAYS = 90;
const END_DATE = process.env.YT_END_DATE || '2026-07-25';

/** 固定シードの擬似乱数（mulberry32）。実行ごとに結果がぶれないようにするため。 */
const makeRandom = (seed) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const random = makeRandom(20260725);

const shiftDays = (dateString, days) => {
	const date = new Date(`${dateString}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
};

const startDate = shiftDays(END_DATE, -(DAYS - 1));

// --- 日別データ -------------------------------------------------------------
const daily = [];
for (let index = 0; index < DAYS; index += 1) {
	const day = shiftDays(startDate, index);
	const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();

	const growth = 1 + index * 0.012; // ゆるやかな右肩上がり
	const weekend = weekday === 0 || weekday === 6 ? 1.25 : 1; // 週末は伸びる
	const spike = index >= 62 && index <= 66 ? 2.6 : 1; // 1本バズった想定
	const noise = 0.85 + random() * 0.3;

	const views = Math.round(820 * growth * weekend * spike * noise);
	const averageViewPercentage = Number((38 + random() * 14).toFixed(2));
	const averageViewDuration = Math.round(150 + random() * 90);
	const estimatedMinutesWatched = Math.round((views * averageViewDuration) / 60);
	const subscribersGained = Math.round(views * (0.008 + random() * 0.006));
	const subscribersLost = Math.round(subscribersGained * (0.12 + random() * 0.18));

	daily.push({
		day,
		views,
		estimated_minutes_watched: estimatedMinutesWatched,
		average_view_duration: averageViewDuration,
		average_view_percentage: averageViewPercentage,
		subscribers_gained: subscribersGained,
		subscribers_lost: subscribersLost,
		net_subscribers: subscribersGained - subscribersLost,
		likes: Math.round(views * (0.03 + random() * 0.02)),
		comments: Math.round(views * (0.003 + random() * 0.003)),
		shares: Math.round(views * (0.004 + random() * 0.004))
	});
}

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
	daily
);

// --- 動画別データ -----------------------------------------------------------
const titles = [
	'【保存版】Evidence.devでYouTube分析を自動化する方法',
	'毎朝5分でできるデータ整理のルーティン',
	'初心者がつまずくSQLの落とし穴7選',
	'ノーコードでダッシュボードを作ってみた',
	'せどりの仕入れ判断をデータでやる話',
	'【実演】1時間でレポートを組み立てる',
	'ブログのアクセス解析、結局どこを見る？',
	'DuckDBが便利すぎたので紹介します',
	'売上管理シートを卒業した日',
	'YouTubeアナリティクスの見方をやさしく解説',
	'グラフの色選びで伝わり方が変わる',
	'データ分析、まず何から始める？',
	'自動レポートで浮いた時間の使い道',
	'視聴維持率を上げるためにやったこと',
	'【雑談】分析ツール遍歴をふりかえる',
	'CSVとにらめっこしていた頃の話',
	'ダッシュボードは作って終わりじゃない',
	'週次ふりかえりのテンプレート公開',
	'指標を絞ると意思決定が速くなる',
	'はじめてのデータパイプライン'
];

const videos = titles.map((title, index) => {
	const isHit = index === 0 || index === 5;
	const base = isHit ? 26000 : Math.round(9000 / (index * 0.55 + 1));
	const views = Math.round(base * (0.8 + random() * 0.45));
	const averageViewPercentage = Number((32 + random() * 26).toFixed(2));
	const averageViewDuration = Math.round(140 + random() * 160);
	return {
		video_id: `smpl${String(index).padStart(3, '0')}vid`,
		title,
		published_at: shiftDays(END_DATE, -(8 + index * 9)),
		duration_seconds: Math.round(240 + random() * 900),
		url: '#',
		views,
		estimated_minutes_watched: Math.round((views * averageViewDuration) / 60),
		average_view_duration: averageViewDuration,
		average_view_percentage: averageViewPercentage,
		likes: Math.round(views * (0.03 + random() * 0.025)),
		comments: Math.round(views * (0.003 + random() * 0.004)),
		shares: Math.round(views * (0.004 + random() * 0.005)),
		subscribers_gained: Math.round(views * (0.008 + random() * 0.01))
	};
});

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
	videos.sort((a, b) => b.views - a.views)
);

// --- 流入経路 ---------------------------------------------------------------
const totalViews = daily.reduce((sum, row) => sum + row.views, 0);
const trafficShares = [
	['YT_SEARCH', 0.31],
	['RELATED_VIDEO', 0.24],
	['SHORTS', 0.14],
	['SUBSCRIBER', 0.11],
	['EXT_URL', 0.07],
	['NOTIFICATION', 0.05],
	['PLAYLIST', 0.04],
	['YT_CHANNEL', 0.03],
	['NO_LINK_OTHER', 0.01]
];

writeCsv(
	join(SOURCE_DIR, 'traffic_sources.csv'),
	['source_type', 'source_label', 'views', 'estimated_minutes_watched'],
	trafficShares.map(([sourceType, share]) => {
		const views = Math.round(totalViews * share);
		return {
			source_type: sourceType,
			source_label: trafficSourceLabel(sourceType),
			views,
			estimated_minutes_watched: Math.round((views * (150 + random() * 120)) / 60)
		};
	})
);

// --- 国別 -------------------------------------------------------------------
const countryShares = [
	['JP', 0.72],
	['US', 0.08],
	['TW', 0.05],
	['KR', 0.04],
	['TH', 0.03],
	['GB', 0.02],
	['AU', 0.02],
	['CA', 0.02],
	['DE', 0.01],
	['SG', 0.01]
];

writeCsv(
	join(SOURCE_DIR, 'geography.csv'),
	['country_code', 'country_name', 'views', 'estimated_minutes_watched', 'average_view_duration'],
	countryShares.map(([code, share]) => {
		const views = Math.round(totalViews * share);
		const averageViewDuration = Math.round(130 + random() * 110);
		return {
			country_code: code,
			country_name: countryLabel(code),
			views,
			estimated_minutes_watched: Math.round((views * averageViewDuration) / 60),
			average_view_duration: averageViewDuration
		};
	})
);

// --- デバイス別 -------------------------------------------------------------
const deviceShares = [
	['MOBILE', 0.62],
	['DESKTOP', 0.21],
	['TABLET', 0.09],
	['TV', 0.07],
	['GAME_CONSOLE', 0.01]
];

writeCsv(
	join(SOURCE_DIR, 'devices.csv'),
	['device_type', 'device_label', 'views', 'estimated_minutes_watched'],
	deviceShares.map(([deviceType, share]) => {
		const views = Math.round(totalViews * share);
		return {
			device_type: deviceType,
			device_label: deviceLabel(deviceType),
			views,
			estimated_minutes_watched: Math.round((views * (140 + random() * 130)) / 60)
		};
	})
);

// --- 視聴者属性 -------------------------------------------------------------
const ageGroups = ['age18-24', 'age25-34', 'age35-44', 'age45-54', 'age55-64', 'age65-'];
const ageWeights = [0.14, 0.34, 0.26, 0.15, 0.08, 0.03];
const demographics = [];
for (const [index, ageGroup] of ageGroups.entries()) {
	const femaleShare = 0.42 + random() * 0.16;
	for (const gender of ['female', 'male']) {
		const share = ageWeights[index] * (gender === 'female' ? femaleShare : 1 - femaleShare);
		demographics.push({
			age_group: ageGroup,
			age_label: ageGroupLabel(ageGroup),
			gender,
			gender_label: genderLabel(gender),
			viewer_percentage: Number((share * 100).toFixed(2))
		});
	}
}

writeCsv(
	join(SOURCE_DIR, 'demographics.csv'),
	['age_group', 'age_label', 'gender', 'gender_label', 'viewer_percentage'],
	demographics
);

// --- メタ情報 ---------------------------------------------------------------
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
			generated_at: `${END_DATE}T03:05:00.000Z`,
			start_date: startDate,
			end_date: END_DATE,
			channel_id: 'SAMPLE_CHANNEL',
			channel_title: 'サンプルチャンネル',
			total_subscribers: 18420,
			total_views: 2481000,
			total_videos: 132,
			is_sample: 'true'
		}
	]
);

console.log('サンプルデータを生成しました。');
