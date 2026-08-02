---
title: YouTube チャンネルレポート
description: 毎日お昼に自動更新される、チャンネルの成果まとめ
---

```sql meta
select
  channel_title,
  cast(start_date as date) as start_date,
  cast(end_date as date) as end_date,
  cast(generated_at as varchar) as generated_at,
  total_subscribers,
  total_views,
  total_videos,
  cast(is_sample as varchar) = 'true' as is_sample
from youtube.meta
```

```sql daily
select
  cast(day as date) as day,
  views,
  estimated_minutes_watched,
  round(estimated_minutes_watched / 60.0, 1) as hours_watched,
  round(avg(views) over (order by cast(day as date) rows between 6 preceding and current row)) as views_ma7,
  subscribers_gained,
  -- 減少分はマイナス方向に積むので符号を反転させておく
  -subscribers_lost as subscribers_lost,
  net_subscribers,
  sum(net_subscribers) over (order by cast(day as date)) as cumulative_net_subscribers,
  likes,
  comments,
  shares,
  average_view_percentage,
  average_view_duration
from youtube.daily
order by day
```

```sql summary
with d as (
  select
    cast(day as date) as day,
    views,
    estimated_minutes_watched,
    net_subscribers,
    likes,
    comments,
    shares
  from youtube.daily
),
bounds as (
  select max(day) as end_day from d
),
labelled as (
  select
    case
      when d.day > b.end_day - interval 28 day then 'current'
      when d.day > b.end_day - interval 56 day then 'previous'
    end as period,
    d.*
  from d cross join bounds b
),
agg as (
  select
    period,
    sum(views) as views,
    sum(estimated_minutes_watched) / 60.0 as hours_watched,
    sum(net_subscribers) as net_subscribers,
    sum(likes) + sum(comments) + sum(shares) as engagements,
    sum(estimated_minutes_watched) * 60.0 / nullif(sum(views), 0) as avg_view_seconds
  from labelled
  where period is not null
  group by period
),
current_period as (select * from agg where period = 'current'),
previous_period as (select * from agg where period = 'previous')
select
  c.views,
  c.hours_watched,
  c.net_subscribers,
  c.engagements,
  c.avg_view_seconds,
  (c.views - p.views) / nullif(cast(p.views as double), 0) as views_change,
  (c.hours_watched - p.hours_watched) / nullif(p.hours_watched, 0) as hours_change,
  (c.net_subscribers - p.net_subscribers) / nullif(cast(abs(p.net_subscribers) as double), 0) as subscribers_change,
  (c.engagements - p.engagements) / nullif(cast(p.engagements as double), 0) as engagements_change,
  (c.avg_view_seconds - p.avg_view_seconds) / nullif(p.avg_view_seconds, 0) as duration_change
from current_period c
cross join previous_period p
```

```sql traffic
select
  source_label,
  views,
  round(estimated_minutes_watched / 60.0) as hours_watched,
  views / cast(sum(views) over () as double) as share
from youtube.traffic_sources
order by views desc
```

```sql devices
select
  device_label,
  views,
  views / cast(sum(views) over () as double) as share
from youtube.devices
order by views desc
```

```sql top_videos
select
  title,
  url,
  cast(published_at as date) as published_at,
  views,
  round(estimated_minutes_watched / 60.0) as hours_watched,
  average_view_percentage / 100.0 as retention,
  subscribers_gained
from youtube.videos
order by views desc
limit 10
```

# YouTube チャンネルレポート

<Value data={meta} column=channel_title /> ／ 集計期間 <Value data={meta} column=start_date fmt='yyyy-mm-dd' /> 〜 <Value data={meta} column=end_date fmt='yyyy-mm-dd' />

{#if meta[0].is_sample}
<Alert status=warning>

**これはサンプルデータです。** 実際のチャンネルの数値ではありません。
`README.md` の手順で YouTube Analytics API の認証情報を設定すると、実データに切り替わります。

</Alert>
{/if}

## 直近28日間のサマリー

前の28日間と比べた変化を並べています。

<Grid cols=4>
  <BigValue
    data={summary}
    value=views
    title="視聴回数"
    fmt=num0
    comparison=views_change
    comparisonTitle="前28日比"
    comparisonFmt=pct1
  />
  <BigValue
    data={summary}
    value=hours_watched
    title="総再生時間（時間）"
    fmt=num0
    comparison=hours_change
    comparisonTitle="前28日比"
    comparisonFmt=pct1
  />
  <BigValue
    data={summary}
    value=net_subscribers
    title="登録者の純増"
    fmt=num0
    comparison=subscribers_change
    comparisonTitle="前28日比"
    comparisonFmt=pct1
  />
  <BigValue
    data={summary}
    value=avg_view_seconds
    title="平均視聴時間（秒）"
    fmt=num0
    comparison=duration_change
    comparisonTitle="前28日比"
    comparisonFmt=pct1
  />
</Grid>

チャンネル累計は 登録者 <Value data={meta} column=total_subscribers fmt=num0 /> 人、総再生回数 <Value data={meta} column=total_views fmt=num0 /> 回、公開動画 <Value data={meta} column=total_videos fmt=num0 /> 本です。

## 視聴回数の推移

細い実線が日々の視聴回数、太い線が7日移動平均です。曜日の凸凹をならして見たいときは移動平均のほうを追ってください。

<LineChart
  data={daily}
  x=day
  y={['views', 'views_ma7']}
  yAxisTitle="視聴回数"
  seriesLabels={{ views: '日別', views_ma7: '7日移動平均' }}
  yFmt=num0
/>

## 登録者の増減

ゼロより上が増えた数、下が減った数です。差し引きが日々の純増になります。

<BarChart
  data={daily}
  x=day
  y={['subscribers_gained', 'subscribers_lost']}
  type=stacked
  yAxisTitle="登録者数"
  seriesLabels={{ subscribers_gained: '増加', subscribers_lost: '減少' }}
  yFmt=num0
/>

期間のはじめを0としたときの、登録者数の積み上がりです。

<LineChart
  data={daily}
  x=day
  y=cumulative_net_subscribers
  yAxisTitle="期間内の累計純増（人）"
  yFmt=num0
/>

## 視聴者はどこから来ているか

<Grid cols=2>
  <BarChart
    data={traffic}
    title="流入経路"
    x=source_label
    y=views
    swapXY=true
    xAxisTitle=" "
    yAxisTitle="視聴回数"
    yFmt=num0
  />
  <BarChart
    data={devices}
    title="視聴デバイス"
    x=device_label
    y=views
    swapXY=true
    xAxisTitle=" "
    yAxisTitle="視聴回数"
    yFmt=num0
  />
</Grid>

<Details title="数値で確認する">

<DataTable data={traffic} rows=all>
  <Column id=source_label title="流入経路" />
  <Column id=views title="視聴回数" fmt=num0 />
  <Column id=share title="構成比" fmt=pct1 contentType=bar />
  <Column id=hours_watched title="再生時間（時間）" fmt=num0 />
</DataTable>

<DataTable data={devices} rows=all>
  <Column id=device_label title="デバイス" />
  <Column id=views title="視聴回数" fmt=num0 />
  <Column id=share title="構成比" fmt=pct1 contentType=bar />
</DataTable>

</Details>

## よく見られた動画 トップ10

<DataTable data={top_videos} rows=all link=url>
  <Column id=title title="タイトル" wrap=true />
  <Column id=published_at title="公開日" fmt='yyyy-mm-dd' />
  <Column id=views title="視聴回数" fmt=num0 />
  <Column id=hours_watched title="再生時間（時間）" fmt=num0 />
  <Column id=retention title="平均視聴維持率" fmt=pct1 />
  <Column id=subscribers_gained title="登録者増" fmt=num0 />
</DataTable>

[動画ごとの内訳を見る](/videos) ／ [視聴者の内訳を見る](/audience)

---

最終更新: <Value data={meta} column=generated_at />（UTC）
