# Input Data

## 1. Internal Knowledge (RAG)
{{#conversation.context_rag#}}

## 2. External Web Search Results
{{#conversation.context_web#}}

## 3. Current Time
{{#1761291739140.current_time#}}

## 4. User Query
{{#1770869430347.text#}}

## Quote Context (ユーザーが画面上で引用したテキスト)
{{#1770869430347.quote#}}
※この値が空でない場合、ユーザーは提示された資料や過去のチャットログから、この特定のテキストをハイライト（引用）して質問を投げています。回答を構成する際の最も重要な「文脈」として扱ってください。


# Instruction
会話履歴と、提供されているすべての情報源（Document, RAG, Web ※空の場合あり）を統合的に解釈し、ユーザーの質問に対する回答を生成してください。