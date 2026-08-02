---
title: 動画別のパフォーマンス
description: どの動画が伸びていて、どの動画で離脱しているか
---

```sql videos
select
  title,
  url,
  cast(published_at as date) as published_at,
  duration_seconds,
  views,
  round(estimated_minutes_watched / 60.0) as hours_watched,
  average_view_duration,
  average_view_percentage / 100.0 as retention,
  likes,
  comments,
  shares,
  subscribers_gained,
  -- 1,000回再生あたり何人が登録したか。規模の違う動画を並べて比べるための指標。
  subscribers_gained * 1000.0 / nullif(views, 0) as subs_per_1k_views,
  (likes + comments + shares) * 1.0 / nullif(views, 0) as engagement_rate
from youtube.videos
order by views desc
```

```sql retention_ranked
select
  title,
  views,
  average_view_percentage / 100.0 as retention
from youtube.videos
where views >= 100
order by retention desc
limit 12
```

```sql subs_ranked
select
  title,
  views,
  subscribers_gained,
  subscribers_gained * 1000.0 / nullif(views, 0) as subs_per_1k_views
from youtube.videos
where views >= 100
order by subs_per_1k_views desc
limit 12
```

# 動画別のパフォーマンス

集計期間中に視聴された動画を、視聴回数の多い順に並べています。

## 視聴維持率が高い動画

最後まで見てもらえている動画です。視聴回数が100回未満の動画は、比率がぶれるため除いています。

<BarChart
  data={retention_ranked}
  x=title
  y=retention
  swapXY=true
  xAxisTitle=" "
  yAxisTitle="平均視聴維持率"
  yFmt=pct0
/>

## 登録につながっている動画

1,000回再生あたりの登録者数で並べています。視聴回数そのものは少なくても、
「見た人がファンになりやすい」動画を見つけるための指標です。

<BarChart
  data={subs_ranked}
  x=title
  y=subs_per_1k_views
  swapXY=true
  xAxisTitle=" "
  yAxisTitle="1,000回再生あたりの登録者数"
  yFmt=num1
/>

## 全動画の一覧

<DataTable data={videos} rows=25 search=true link=url>
  <Column id=title title="タイトル" wrap=true />
  <Column id=published_at title="公開日" fmt='yyyy-mm-dd' />
  <Column id=views title="視聴回数" fmt=num0 contentType=bar />
  <Column id=hours_watched title="再生時間（時間）" fmt=num0 />
  <Column id=average_view_duration title="平均視聴時間（秒）" fmt=num0 />
  <Column id=retention title="視聴維持率" fmt=pct1 />
  <Column id=engagement_rate title="反応率" fmt=pct2 />
  <Column id=subscribers_gained title="登録者増" fmt=num0 />
  <Column id=subs_per_1k_views title="登録者/1,000回" fmt=num1 />
</DataTable>

「反応率」は（高評価＋コメント＋共有）÷ 視聴回数です。

[トップに戻る](/)
