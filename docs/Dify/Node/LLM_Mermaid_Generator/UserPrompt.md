# Instruction
以下のユーザーの要望（Query）と、会話履歴（Memory）・提供されたコンテキスト（Context）を
統合的に解釈し、Mermaid図のコードを指定されたJSONスキーマで出力してください。

---
## User Query（Mermaid図に関するユーザーの要望・修正指示）
{{#sys.query#}}

## Quote Context（ユーザーが画面上でハイライト/引用したテキスト）
{{#1770869430347.quote#}}
※この値が存在する場合、引用テキストを図の主軸・修正対象の手がかりとして優先的に使用してください。

---
# Current State（現在の図の状態）
## 図の生成済みフラグ
{{#conversation.hasreceivedartifact_mermaid#}}
※ "true" の場合は会話履歴（### 前回のAI応答 セクション）を参照し、
  最も直近のMermaid図の artifact_content を既存コードとして読み取ってください。
※ "false" または空の場合はゼロから生成してください。

---
# Context Data（情報源）
## 1. 添付ファイル内容
【ファイル名】: {{#conversation.context_file_name#}}
【内容】: {{#conversation.context_file#}}

## 2. 社内ナレッジ（RAG検索結果）
{{#conversation.context_rag#}}

## 3. Web検索結果
{{#conversation.context_web#}}

---
# 現在時刻
{{#1761291739140.current_time#}}

---
# Action
まず初回生成か修正かを判断し、指定されたJSONスキーマに100%合致する形で出力してください。
`artifact_content`（Mermaidコード）を完全に生成し終えてから `answer` を出力してください。