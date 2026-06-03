# Instruction
以下のユーザーの要望（Query）と、会話履歴（Memory）・提供されたコンテキスト（Context）を
統合的に解釈し、Draw.io スイムレーン図の構造データを指定されたJSONスキーマで出力してください。

---
## User Query（フロー図に関するユーザーの要望・修正指示）
{{#sys.query#}}

## Quote Context（ユーザーが画面上でハイライト/引用したテキスト）
{{#1770869430347.quote#}}
※この値が存在する場合、引用テキストを図の主軸・変更対象の手がかりとして扱ってください。

---
# Current State（現在の図の状態）
## 図の生成済みフラグ
{{#conversation.hasreceivedartifact_drawio#}}
※ "true" の場合は会話履歴（上部の ### 前回のAI応答 セクション）を参照し、
  最も直近に生成・更新されたDraw.io図の artifact_content を既存XMLとして読み取ってください。
※ "false" または空の場合は is_full_generate = "true" として扱ってください。

---
# Context Data（情報源）
図の構造は、以下の提供された情報に基づき構成してください。

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
上記情報を読み解き、まず `is_full_generate` を判定したうえで、
指定されたJSONスキーマに100%合致する形で全フィールドを出力してください。
is_full_generate = "false" の場合は `changes`・`preserved_ids` に
変更箇所と保持箇所を必ず明示してください。