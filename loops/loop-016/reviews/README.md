# reviews — ペルソナレビューの記録

- 各ケースの完成LPごとに、読み手に合わせたペルソナで fresh-eye レビューを行う
- 返却の4観点（原文のまま記録。要約しない）:
  1. 分からない所（unclear）
  2. 離脱点（drop-off）
  3. 応募者としての質問（applicant questions）
  4. AIっぽさ（AI-ness with evidence）

## 書式

`reviews/case-X-gen-N-review.md`:

```md
# Persona review: C-X gen-N

- case: C-X (label)
- LP: previews/case-X-gen-N-complete.html
- persona: <name, age, background from cases/case-X.json plan.persona>
- date: 2026-11-0x
- model: <Meta API model if used, or human>

## 1. Unclear
- ...

## 2. Drop-off
- ...

## 3. Applicant questions
- ...

## 4. AI-ness
- ...
```

- この4観点の verbatim を `run-record.md` の「ペルソナレビューの記録」表にも要約リンクする
- カウントは Baseten 枠に含めず Meta API 別枠として tokens/回数を記録する
