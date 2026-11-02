# checks — ページ級欠陥の2層検出（2026-11-02）

- 置き場所: `loops/loop-016/tools/` と `loops/loop-016/checks/`（本体コードには触れない）
- 第1層 `loop16-pagecheck.mjs`: ルールベース、決定的、APIなし。出力 `case-*-pagecheck.{json,md}`（場所つき警告）。辞書は `tools/dicts/*.json` にcandidateとして置く。
- 第2層 `loop16-judge.mjs`: Few-shot対比ジャッジ（Meta枠、Baseten枠に含めない）。出力 `case-*-judge.md` verbatim。ペアは `checks/pairs/*.md` に出典つきで置く（candidate, not product）。
- 新しいルール・辞書・ペアは候補として追加し、恒常化は本人承認を経る。ループが勝手に書き換えない。
- 画像の目視は含まない（テキスト検出のみ）。キーの値は扱わない。
- 初回トライアル: gen-001 6本に両層を実行し、統括目視（C-A/C-F）を正解として対照。結果は `run-record.md` の「ページ級検出の初回トライアル」節を参照。
