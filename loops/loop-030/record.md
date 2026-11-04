# loop-030 — 抽出の欠陥修正（ stated な否定の喪失）と Sorano 再走の準備

2026-11-05 朝。実施: 統括（本人の決定による）。これは提出のための調整ではなく、抽出の誤りを直すための修正である（本人の線引き: 「回すために調整するけど提出の為に調整するならだめ」）。

## 本人の決定（この作業の前提）

- 「うまくいく条件で回しても意味ない」— 完走実績のある FICT-E03 の再走は証明にならないため却下。
- 「抽出を直して Sorano を回す（提出はその後）」「出来なければ提出間に合わなくていい」「回らないなら研究として失敗」— 本物の走行が研究の本体であり、提出はその後。
- あわせて本人の指摘: 統括側の完走（loop-027 run8〜10）は、統括が承認フィクスチャ・再提示・フィードバックを入れて回したもので、その手入れは本人の席から見えなかった。よって今回の再走は、統括・ラインとも走行中に手を入れず、チェックポイントは本人が答え、停止は停止として記録する形で行う。

## 欠陥（実測と照合で確定した事実）

- Sorano（架空）の原本 L01 は "Monthly income is not guaranteed" と明記。抽出（fact-extract-v1.2）は monthlyIncomeGuarantee を unstated（value null、引用なし）に落とした。
- 参照 FACT `src/facts/FICT-J01-facts-v1.json` は同義の「月収は保証しない」を stated／値「保証しない」で記録。生成側 `src/generate.mjs` の定義も「月収が保証されないことを言う項目」で、記載時は非保証の文言を機械チェックしている。
- 原因は抽出プロンプト v1.2 の定義行そのもの: "monthlyIncomeGuarantee is ONLY an explicitly guaranteed minimum monthly income"（月給を保証と誤分類しないための行）。モデルがこれを過剰適用し、明示された否定を「保証の不在」として落とした。
- 機械ゲート（逐語・スキーマ）は引用の整合しか見ないため、この意味の喪失は素通りした。捕捉したのは承認チェックポイントでのレビューであり、チェックポイントの存在意義どおりの捕捉だった。

## 修正（1要因のみ）

- `src/extract-and-check.mjs`: プロンプト版 fact-extract-v1.3 を追加。v1.2 との差分は monthlyIncomeGuarantee の定義行のみ — 保証額の明記はその額を、非保証の明記（月収は保証しない等）は stated／値「保証しない」を記録し、月給そのものは従来どおり monthlySalary に分ける。v1.2 は履歴として不変。
- `src/run-demo.mjs`: 抽出の起動を `--prompt v1.3` に切替（この1か所のみ）。
- ゲートの緩和、Sorano 固有の特例、判定基準の変更は一切なし。
- 回帰: `src/extract-and-check.test.mjs` にプロンプト内容の照合を追加（v1.3 に非保証ルールがあること、v1.2 に無いこと＝変更が1要因に閉じていること）。

## 検証

- 全9スイート合格（exit 0）: approve 11 / extract-and-check 16（新規4件含む）/ generate-images 14 / generate-persona 39 / generate-typed 25 / generate 23 / pipeline-fix / run-demo 85 / verify 52。
- 意味の修正そのもの（否定文が stated で抽出されるか）は、次節の実走で検証する。ユニットテストはプロンプトの文面までしか保証しない。

## 再走の手順（本人の PC、制作ラインのターミナル）

1. リポジトリを pull する。
2. 本人がコマンドを実行する: `node make-lp.mjs tmp/sorano-20261105-en.txt --posting-id sorano-20261105-en-rerun --language English`
3. チェックポイント（承認・1枚画・文章・LP）は本人がプレビューで答える。統括・ラインは走行中に手を入れない。止まったら、止まった場所と理由をそのまま記録する。
