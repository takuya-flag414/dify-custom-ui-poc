# Instruction
以下のユーザーの修正指示（Query）と、会話履歴（Memory）に含まれる直前のDraw.io図を統合し、
指定箇所のみを安全に編集した完全なXMLを指定されたJSONスキーマで出力してください。

---
## User Query（ユーザーの修正指示）
{{#sys.query#}}

## Quote Context（ユーザーが画面上でハイライト/引用したテキスト）
{{#1770869430347.quote#}}
※この値が存在する場合、引用テキストを修正対象の特定に優先的に使用してください。

---
# Current Draw.io XML（編集ベース）
会話履歴（上部の ### 前回のAI応答 セクション）を参照し、
最も直近に生成・更新されたDraw.io図の以下を特定してください：

- **artifact_content**（既存のXML全体）→ 編集のベースとして使用
- **artifact_title**（既存の図タイトル）→ 変更がなければそのまま引き継ぐ

※ 会話履歴に複数のDraw.io図が存在する場合は、**最も新しいターンのもの**を使用してください。

---
# Analyzer Output（前段の分析ノードが特定した差分情報）
以下のJSONデータに基づいて編集を実施してください。

{{#LLM_Drawio_Analyzer.structuredoutput#}}

---
# 現在時刻
{{#1761291739140.current_time#}}

---
# Action
会話履歴から特定した既存XMLをベースに、`changes` リストの内容のみを適用してください。
`preserved_ids` のノードは絶対に変更しないでください。
`artifact_content`（編集済みXML全体）を完全に生成し終えてから、`answer` を出力してください。
`answer` では【変更した箇所】と【変更しなかった箇所】を箇条書きで必ず明示してください。