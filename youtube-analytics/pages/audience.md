---
title: 視聴者の内訳
description: どこの国の、どんな人が見てくれているか
---

```sql geography
select
  country_name,
  country_code,
  views,
  round(estimated_minutes_watched / 60.0) as hours_watched,
  average_view_duration,
  views / cast(sum(views) over () as double) as share
from youtube.geography
order by views desc
limit 12
```

```sql demographics
select
  age_label,
  gender_label,
  viewer_percentage / 100.0 as share
from youtube.demographics
order by age_label, gender_label
```

```sql age_totals
select
  age_label,
  sum(viewer_percentage) / 100.0 as share
from youtube.demographics
group by age_label
order by age_label
```

```sql demographics_rowcount
select count(*) as row_count from youtube.demographics
```

# 視聴者の内訳

## 国・地域別

<BarChart
  data={geography}
  x=country_name
  y=views
  swapXY=true
  xAxisTitle=" "
  yAxisTitle="視聴回数"
  yFmt=num0
/>

<DataTable data={geography} rows=all>
  <Column id=country_name title="国・地域" />
  <Column id=views title="視聴回数" fmt=num0 />
  <Column id=share title="構成比" fmt=pct1 contentType=bar />
  <Column id=hours_watched title="再生時間（時間）" fmt=num0 />
  <Column id=average_view_duration title="平均視聴時間（秒）" fmt=num0 />
</DataTable>

## 年齢と性別

{#if demographics_rowcount[0].row_count > 0}

<BarChart
  data={demographics}
  x=age_label
  y=share
  series=gender_label
  type=grouped
  xAxisTitle=" "
  yAxisTitle="視聴者の割合"
  yFmt=pct0
/>

年齢層だけで見た割合は次のとおりです。

<DataTable data={age_totals} rows=all>
  <Column id=age_label title="年齢層" />
  <Column id=share title="割合" fmt=pct1 contentType=bar />
</DataTable>

{:else}

<Alert status=info>

視聴者属性のデータがありません。YouTube はサンプル数が少ないチャンネル・期間では
年齢や性別の内訳を返さないことがあります。期間を長くすると出てくる場合があります。

</Alert>

{/if}

[トップに戻る](/)
