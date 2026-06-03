# Instruction
以下のワークフロー構造データ（Analyzer Output）と、元のユーザー要望（Query）を統合し、
Draw.io スイムレーン図の完全なXMLを指定されたJSONスキーマで出力してください。

---
## User Query（元のユーザーの要望）
{{#sys.query#}}

## Quote Context（ユーザーが画面上でハイライト/引用したテキスト）
{{#1770869430347.quote#}}
※この値が存在する場合、引用テキストの内容を図の主軸として扱ってください。

---
# Analyzer Output（前段の分析ノードが生成した構造データ）
以下のJSON構造データをもとに Draw.io XML をゼロから構築してください。

{{#LLM_Drawio_Analyzer.structuredoutput#}}

---
# 現在時刻
{{#1761291739140.current_time#}}

---
# Action
上記の構造データを忠実にDraw.io XML（mxfile形式）に変換し、
指定されたJSONスキーマに100%合致する形で出力してください。
`artifact_content`（XML）を完全に生成し終えてから、`answer` を出力してください。