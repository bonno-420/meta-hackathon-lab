# Pair 02 — loop-012 (typed) vs loop-013 (persona) generation (JA)

- source: loops/loop-012/typed-generation.json (model muse-spark-1.3-contributor, prompt lp-generate-v2-typed) vs loops/loop-013/persona-generation.json (same model, prompt lp-generate-v3-persona)
- facts: FICT-J01-facts v1 (employer=ソラノ輪具研究所, contractPeriod=3か月, salaryHourly=1,500円, workHours=09:00-18:00 etc.)
- purpose: P1 文の逐語反復による仕様書化 の対比。loop-012は同じ事実を結合文で反復、loop-013は分離・用途別に配置
- status: candidate

## Bad (loop-012) — generation sentences (excerpt, verbatim from JSON)

1. 架空のソラノ輪具研究所の求人番号はFICT-J01で、勤務地は架空の青空実験区A棟で、雇用形態は有期契約社員である。
2. 契約期間は3か月で、給与は時給1,500円で、勤務時間は09:00〜18:00で、休憩60分で、実働8時間で、交通費は実費支給で月上限10,000円である。
3. 月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するもので、月収は保証しない。
4. 勤務地は架空の青空実験区A棟で、勤務時間は09:00〜18:00である。
5. 更新の有無は未記載であり、寮の有無と費用は未記載である。
6. この求人は架空のソラノ輪具研究所の有期契約社員で、契約期間は3か月であり、給与は時給1,500円である。

*Observation:* S1とS4で勤務地+勤務時間を反復、S2とS6で契約期間+給与を反復。S2は7事実を1文に詰め込んだ仕様書文。P1=ある。散文評価では「文が長い」は拾えたが、ページ級の反復は拾えない。

## Good (loop-013) — generation sentences (excerpt)

1. 架空のソラノ輪具研究所の求人番号FICT-J01で、勤務地は架空の青空実験区A棟、雇用形態は有期契約社員、契約期間は3か月です。
2. 給与は時給1,500円で、月20日勤務は試算用の仮定であり、実際の収入は勤務日数や残業の増減などで変動するため、月収は保証しないことをお伝えします。
3. 勤務時間は09:00〜18:00、休憩60分、実働8時間の昼間の固定した時間帯です。
4. 交通費は実費支給で月上限10,000円です。
5. 契約期間は3か月で、更新の有無は未記載ですので、お気軽にお問い合わせください。
6. 寮の有無と費用は未記載ですので、ご相談ください。

*Observation:* 同じ事実数だが、S3で勤務時間帯を用途別にまとめ、S4で交通費を独立。反復なし。P1=ない（ただしP5当事者の声は別途見る）。

---

## Judge cue

- Bad has P1=ある (根拠: S1↔S4, S2↔S6 の逐語重複 + S2の仕様書化)
- Good has P1=ない
- Use this pair to calibrate what counts as "repetition that spec-ifies" vs legitimate re-mention.
