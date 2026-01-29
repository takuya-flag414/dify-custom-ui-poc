# 高度なチャットアプリ API

チャットアプリケーションはセッションの持続性をサポートしており、以前のチャット履歴を応答のコンテキストとして使用できます。これは、チャットボットやカスタマーサービス AIなどに適用できます。

### ベース URL
`https://api.dify.ai/v1`

### 認証
サービス API は `API-Key` 認証を使用します。APIキーはサーバー側に保存し、クライアント側で共有または保存しないことを強くお勧めします。APIキーの漏洩は深刻な結果を招く可能性があります。

すべての API リクエストには、以下のように `Authorization` HTTP ヘッダーに APIキーを含めてください:

```http
Authorization: Bearer {API_KEY}
```

---

## POST /chat-messages

チャットメッセージを送信します。チャットアプリケーションにリクエストを送信します。

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **query** | string | ユーザー入力/質問内容 |
| **inputs** | object | アプリによって定義されたさまざまな変数値の入力を許可します。inputs パラメータには複数のキー/値ペアが含まれ、各キーは特定の変数に対応し、各値はその変数の特定の値です。変数がファイルタイプの場合、以下の files で説明されているキーを持つオブジェクトを指定します。デフォルト `{}` |
| **response_mode** | string | 応答の返却モードを指定します。サポートされているモード:<br>- `streaming`: ストリーミングモード(推奨)、SSE(サーバー送信イベント) を通じてタイプライターのような出力を実装します。<br>- `blocking`: ブロッキングモード、実行完了後に結果を返します。(プロセスが長い場合、リクエストが中断される可能性があります) Cloudflareの制限により、リクエストは100秒後に返答なしで中断されます。 |
| **user** | string | ユーザー識別子、エンドユーザーの身元を定義するために使用され、統計のために使用されます。アプリケーション内で開発者によって一意に定義されるべきです。サービス API は WebApp によって作成された会話を共有しません。 |
| **conversation_id** | string | 会話ID、以前のチャット記録に基づいて会話を続けるには、以前のメッセージの `conversation_id` を渡す必要があります。 |
| **files** | array[object] | ファイルリスト、モデルが Vision/Video 機能をサポートしている場合に限り、ファイルをテキスト理解および質問応答に組み合わせて入力するのに適しています。<br><br>**type** (string): サポートされるタイプ:<br>- `document`: 'TXT', 'MD', 'MARKDOWN', 'MDX', 'PDF', 'HTML', 'XLSX', 'XLS', 'VTT', 'PROPERTIES', 'DOC', 'DOCX', 'CSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB'<br>- `image`: 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'<br>- `audio`: 'MP3', 'M4A', 'WAV', 'WEBM', 'MPGA'<br>- `video`: 'MP4', 'MOV', 'MPEG', 'WEBM'<br>- `custom`: その他のファイルタイプ<br><br>**transfer_method** (string): 転送方法<br>- `remote_url`: ファイルのURL。<br>- `local_file`: ファイルをアップロード。<br><br>**url** (string): ファイルのURL。(転送方法が `remote_url` の場合のみ)。<br>**upload_file_id** (string): アップロードされたファイルID。(転送方法が `local_file` の場合のみ)。 |
| **auto_generate_name** | bool | タイトルを自動生成、デフォルトは true。false に設定すると、会話のリネームAPIを呼び出し、auto_generate を true に設定することで非同期タイトル生成を実現できます。 |
| **workflow_id** | string | (オプション) ワークフローID、特定のバージョンを指定するために使用、提供されない場合はデフォルトの公開バージョンを使用。 |
| **trace_id** | string | (オプション) トレースID。既存の業務システムのトレースコンポーネントと連携し、エンドツーエンドの分散トレーシングを実現するために使用します。指定がない場合、システムが自動的に trace id を生成します。 |

**trace_id の渡し方（優先順位順）:**
1.  **Header:** HTTPヘッダー `X-Trace-Id` で渡す(最優先)。
2.  **クエリパラメータ:** URLクエリパラメータ `trace_id` で渡す。
3.  **リクエストボディ:** リクエストボディの `trace_id` フィールドで渡す(本フィールド)。

### 応答

response_mode が `blocking` の場合、`Completion Response` オブジェクトを返します。
response_mode が `streaming` の場合、`ChunkCompletionResponse` ストリームを返します。

#### ChatCompletion Response (Blocking)
完全なアプリ結果を返します。Content-Type は `application/json` です。

| Name | Type | Description |
| :--- | :--- | :--- |
| **event** | string | イベントタイプ、固定で `message` |
| **task_id** | string | タスクID、リクエスト追跡と以下のStop Generate APIに使用 |
| **id** | string | ユニークID |
| **message_id** | string | 一意のメッセージID |
| **conversation_id** | string | 会話ID |
| **mode** | string | アプリモード、`chat` として固定 |
| **answer** | string | 完全な応答内容 |
| **metadata** | object | メタデータ<br>- `usage` (Usage) モデル使用情報<br>- `retriever_resources` (array[RetrieverResource]) 引用と帰属リスト |
| **created_at** | int | メッセージ作成タイムスタンプ、例: 1705395332 |

#### ChunkChatCompletion Response (Streaming)
アプリによって出力されたストリームチャンクを返します。Content-Type は `text/event-stream` です。各ストリーミングチャンクは `data:` で始まり、2つの改行文字 `\n\n` で区切られます。

**ストリーミングチャンクの構造は event に応じて異なります:**

* **event: message**
    LLMがテキストチャンクイベントを返します。つまり、完全なテキストがチャンク形式で出力されます。
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `conversation_id` (string): 会話ID
    * `answer` (string): LLMが返したテキストチャンク内容
    * `created_at` (int): 作成タイムスタンプ

* **event: message_file**
    メッセージファイルイベント、ツールによって新しいファイルが作成されました。
    * `id` (string): ファイル一意ID
    * `type` (string): ファイルタイプ、現在は"image"のみ許可
    * `belongs_to` (string): 所属、ここでは'assistant' のみ
    * `url` (string): ファイルのリモートURL
    * `conversation_id` (string): 会話ID

* **event: message_end**
    メッセージ終了イベント、このイベントを受信するとストリーミングが終了したことを意味します。
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `conversation_id` (string): 会話ID
    * `metadata` (object): メタデータ
    * `usage` (Usage): モデル使用情報
    * `retriever_resources` (array[RetrieverResource]): 引用と帰属リスト

* **event: tts_message**
    TTSオーディオストリームイベント、つまり音声合成出力。内容はMp3形式のオーディオブロックで、base64文字列としてエンコードされています。(このメッセージは自動再生が有効な場合にのみ利用可能)
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `audio` (string): 音声合成後のオーディオ (base64)
    * `created_at` (int): 作成タイムスタンプ

* **event: tts_message_end**
    TTSオーディオストリーム終了イベント。
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `audio` (string): 空の文字列
    * `created_at` (int): 作成タイムスタンプ

* **event: message_replace**
    メッセージ内容置換イベント。出力内容のモデレーションが有効な場合、内容がフラグ付けされると、このイベントを通じてメッセージ内容がプリセットの返信に置き換えられます。
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `conversation_id` (string): 会話ID
    * `answer` (string): 置換内容
    * `created_at` (int): 作成タイムスタンプ

* **event: workflow_started**
    ワークフローが実行を開始。
    * `task_id` (string): タスクID
    * `workflow_run_id` (string): ワークフロー実行の一意ID
    * `event` (string): `workflow_started` に固定
    * `data` (object): 詳細
        * `id` (string): ワークフロー実行の一意ID
        * `workflow_id` (string): 関連ワークフローのID
        * `created_at` (timestamp): 作成タイムスタンプ

* **event: node_started**
    ノード実行が開始。
    * `task_id` (string): タスクID
    * `workflow_run_id` (string): ワークフロー実行の一意ID
    * `event` (string): `node_started` に固定
    * `data` (object): 詳細
        * `id` (string): ワークフロー実行の一意ID
        * `node_id` (string): ノードのID
        * `node_type` (string): ノードのタイプ
        * `title` (string): ノードの名前
        * `index` (int): 実行シーケンス番号
        * `predecessor_node_id` (string): オプションのプレフィックスノードID
        * `inputs` (object): ノードで使用されるすべての前のノード変数の内容
        * `created_at` (timestamp): 開始のタイムスタンプ

* **event: node_finished**
    ノード実行が終了。
    * `task_id` (string): タスクID
    * `workflow_run_id` (string): ワークフロー実行の一意ID
    * `event` (string): `node_finished` に固定
    * `data` (object): 詳細
        * `id` (string): ワークフロー実行の一意ID
        * `node_id` (string): ノードのID
        * `node_type` (string): ノードのタイプ
        * `title` (string): ノードの名前
        * `index` (int): 実行シーケンス番号
        * `predecessor_node_id` (string): オプションのプレフィックスノードID
        * `inputs` (object): ノードで使用されるすべての前のノード変数の内容
        * `process_data` (json): オプションのノードプロセスデータ
        * `outputs` (json): オプションの出力内容
        * `status` (string): 実行の状態 (running / succeeded / failed / stopped)
        * `error` (string): オプションのエラー理由
        * `elapsed_time` (float): オプションの使用される合計秒数
        * `execution_metadata` (json): メタデータ
            * `total_tokens` (int): オプションの使用されるトークン数
            * `total_price` (decimal): オプションの合計コスト
            * `currency` (string): オプション、例: USD / RMB
        * `created_at` (timestamp): 開始のタイムスタンプ

* **event: workflow_finished**
    ワークフロー実行が終了。
    * `task_id` (string): タスクID
    * `workflow_run_id` (string): ワークフロー実行の一意ID
    * `event` (string): `workflow_finished` に固定
    * `data` (object): 詳細
        * `id` (string): ワークフロー実行のID
        * `workflow_id` (string): 関連ワークフローのID
        * `status` (string): 実行の状態 (running / succeeded / failed / stopped)
        * `outputs` (json): オプションの出力内容
        * `error` (string): オプションのエラー理由
        * `elapsed_time` (float): オプションの使用される合計秒数
        * `total_tokens` (int): オプションの使用されるトークン数
        * `total_steps` (int): デフォルト0
        * `created_at` (timestamp): 開始時間
        * `finished_at` (timestamp): 終了時間

* **event: error**
    ストリーミングプロセス中に発生する例外。エラーイベントを受信するとストリームが終了します。
    * `task_id` (string): タスクID
    * `message_id` (string): 一意のメッセージID
    * `status` (int): HTTPステータスコード
    * `code` (string): エラーコード
    * `message` (string): エラーメッセージ

* **event: ping**
    接続を維持するために10秒ごとにpingイベントが発生します。

### エラー
* 404: 会話が存在しません
* 400: `invalid_param`, 異常なパラメータ入力
* 400: `app_unavailable`, アプリ構成が利用できません
* 400: `provider_not_initialize`, 利用可能なモデル資格情報構成がありません
* 400: `provider_quota_exceeded`, モデル呼び出しクォータが不足しています
* 400: `model_currently_not_support`, 現在のモデルが利用できません
* 400: `workflow_not_found`, 指定されたワークフローバージョンが見つかりません
* 400: `draft_workflow_error`, ドラフトワークフローバージョンは使用できません
* 400: `workflow_id_format_error`, ワークフローID形式エラー、UUID形式が必要です
* 400: `completion_request_error`, テキスト生成に失敗しました
* 500: 内部サーバーエラー

### リクエスト例 (POST /chat-messages)

```bash
curl -X POST '[https://api.dify.ai/v1/chat-messages](https://api.dify.ai/v1/chat-messages)' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {},
    "query": "What are the specs of the iPhone 13 Pro Max?",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123",
    "files": [
        {
            "type": "image",
            "transfer_method": "remote_url",
            "url": "[https://cloud.dify.ai/logo/logo-site.png](https://cloud.dify.ai/logo/logo-site.png)"
        }
    ]
}'
```

### 応答例 (ブロッキングモード)

```json
{
    "event": "message",
    "task_id": "c3800678-0077-43df-a102-53f23ed20b88",
    "id": "9da23599-e713-473b-982c-4328d4f5c78a",
    "message_id": "9da23599-e713-473b-982c-4328d4f5c78a",
    "conversation_id": "45701982-8118-4bc5-8e9b-64562b4555f2",
    "mode": "chat",
    "answer": "iPhone 13 Pro Maxの仕様は次のとおりです:...",
    "metadata": {
        "usage": {
            "prompt_tokens": 1033,
            "prompt_unit_price": "0.001",
            "prompt_price_unit": "0.001",
            "prompt_price": "0.0010330",
            "completion_tokens": 128,
            "completion_unit_price": "0.002",
            "completion_price_unit": "0.001",
            "completion_price": "0.0002560",
            "total_tokens": 1161,
            "total_price": "0.0012890",
            "currency": "USD",
            "latency": 0.7682376249867957
        },
        "retriever_resources": [
            {
                "position": 1,
                "dataset_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb",
                "document_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",
                "dataset_name": "iPhone",
                "document_name": "iPhone List",
                "segment_id": "ed599c7f-2766-4294-9d1d-e5235061270a",
                "score": 0.98457545,
                "content": "\"Model\", \"Release Date\", \"Display Size\", \"Resolution\","
            }
        ]
    },
    "created_at": 1705407629
}
```

---

## POST /files/upload

メッセージ送信時に使用するファイルをアップロードし、画像とテキストのマルチモーダル理解を可能にします。アプリケーションでサポートされている形式をサポートします。アップロードされたファイルは現在のエンドユーザーのみが使用できます。

### リクエストボディ
このインターフェースは `multipart/form-data` リクエストを必要とします。

| Name | Type | Description |
| :--- | :--- | :--- |
| **file** | File | 必須。アップロードするファイル。 |
| **user** | string | 必須。ユーザー識別子、開発者のルールによって定義され、アプリケーション内で一意でなければなりません。サービス API は WebApp によって作成された会話を共有しません。 |

### 応答
アップロードが成功すると、サーバーはファイルのIDと関連情報を返します。

| Name | Type | Description |
| :--- | :--- | :--- |
| **id** | uuid | ID |
| **name** | string | ファイル名 |
| **size** | int | ファイルサイズ (バイト) |
| **extension** | string | ファイル拡張子 |
| **mime_type** | string | ファイルのMIME タイプ |
| **created_by** | uuid | エンドユーザーID |
| **created_at** | timestamp | 作成タイムスタンプ、例: 1705395332 |

### エラー
* 400: `no_file_uploaded`, ファイルが提供されなければなりません
* 400: `too_many_files`, 現在は1つのファイルのみ受け付けます
* 400: `unsupported_preview`, ファイルはプレビューをサポートしていません
* 400: `unsupported_estimate`, ファイルは推定をサポートしていません
* 413: `file_too_large`, ファイルが大きすぎます
* 415: `unsupported_file_type`, サポートされていない拡張子、現在はドキュメントファイルのみ受け付けます
* 503: `s3_connection_failed`, S3 サービスに接続できません
* 503: `s3_permission_denied`, S3にファイルをアップロードする権限がありません
* 503: `s3_file_too_large`, ファイルがS3のサイズ制限を超えています
* 500: 内部サーバーエラー

### リクエスト例 (POST /files/upload)

```bash
curl -X POST [https://api.dify.ai/v1/files/upload](https://api.dify.ai/v1/files/upload) \
--header 'Authorization: Bearer {api_key}' \
--form 'file=@localfile; type=image/[png|jpeg|jpg|webp|gif]' \
--form 'user=abc-123'
```

### 応答例

```json
{
    "id": "72fa9618-8f89-4037-9b33-7e1178a24a67",
    "name": "example.png",
    "size": 1024,
    "extension": "png",
    "mime_type": "image/png",
    "created_by": "6ad1ab0a-73ff-4ac1-b9e4-cdb312f71f13",
    "created_at": 1577836800
}
```

---

## GET /files/:file_id/preview

アップロードされたファイルをプレビューまたはダウンロードします。このエンドポイントを使用すると、以前にファイルアップロード API でアップロードされたファイルにアクセスできます。ファイルは、リクエストしているアプリケーションのメッセージ範囲内にある場合のみアクセス可能です。

### パスパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **file_id** | string | 必須。プレビューするファイルの一意識別子。ファイルアップロード API レスポンスから取得します。 |

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **as_attachment** | boolean | オプション。ファイルを添付ファイルとして強制ダウンロードするかどうか。デフォルトは false (ブラウザでプレビュー)。 |

### レスポンス
ブラウザ表示またはダウンロード用の適切なヘッダー付きでファイル内容を返します。
* `Content-Type`: ファイル MIMEタイプに基づいて設定
* `Content-Length`: ファイルサイズ (バイト、利用可能な場合)
* `Content-Disposition`: as_attachment=true の場合は "attachment" に設定
* `Cache-Control`: パフォーマンス向上のためのキャッシュヘッダー
* `Accept-Ranges`: 音声/動画ファイルの場合は "bytes" に設定

### エラー
* 400: `invalid_param`, パラメータ入力異常
* 403: `file_access_denied`, ファイルアクセス拒否またはファイルが現在のアプリケーションに属していません
* 404: `file_not_found`, ファイルが見つからないか削除されています
* 500: サーバー内部エラー

### リクエスト例 (GET /files/:file_id/preview)

```bash
curl -X GET [https://api.dify.ai/v1/files/72fa9618-8f89-4037-9b33-7e1178a24a67/preview](https://api.dify.ai/v1/files/72fa9618-8f89-4037-9b33-7e1178a24a67/preview) \
--header 'Authorization: Bearer {api_key}'
```

---

## POST /chat-messages/:task_id/stop

生成を停止。ストリーミングモードでのみサポートされています。

### パスパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **task_id** | string | タスクID、ストリーミングチャンクの返り値から取得できます |

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **user** | string | 必須。ユーザー識別子、エンドユーザーの身元を定義するために使用され、送信メッセージインターフェースで渡されたユーザーと一致している必要があります。 |

### 応答
`result` (string): 常に "success" を返します

### リクエスト例 (POST /chat-messages/:task_id/stop)

```bash
curl -X POST [https://api.dify.ai/v1/chat-messages/:task_id/stop](https://api.dify.ai/v1/chat-messages/:task_id/stop) \
-H 'Authorization: Bearer {api_key}' \
-H 'Content-Type: application/json' \
--data-raw '{
    "user": "abc-123"
}'
```

---

## POST /messages/:message_id/feedbacks

メッセージフィードバック。エンドユーザーはフィードバックメッセージを提供でき、アプリケーション開発者が期待される出力を最適化するのを支援します。

### パスパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **message_id** | string | メッセージID |

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **rating** | string | アップボートは `like`、ダウンボートは `dislike`、アップボートの取り消しは `null` |
| **user** | string | ユーザー識別子、開発者のルールによって定義され、アプリケーション内で一意でなければなりません。 |
| **content** | string | メッセージのフィードバックです。 |

### 応答
`result` (string): 常に "success" を返します

### リクエスト (POST /messages/:message_id/feedbacks)

```bash
curl -X POST [https://api.dify.ai/v1/messages/:message_id/feedbacks](https://api.dify.ai/v1/messages/:message_id/feedbacks) \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "rating": "like",
    "user": "abc-123",
    "content": "message feedback information"
}'
```

---

## GET /app/feedbacks

アプリのメッセージの「いいね」とフィードバックを取得。アプリのエンドユーザーからのフィードバックや「いいね」を取得します。

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **page** | string | (任意) ページ番号。デフォルト値: 1 |
| **limit** | string | (任意) 1ページあたりの件数。デフォルト値: 20 |

### レスポンス
`data` (リスト): このアプリの「いいね」とフィードバックの一覧を返します。

### リクエスト (GET /app/feedbacks)

```bash
curl -X GET [https://api.dify.ai/v1/app/feedbacks](https://api.dify.ai/v1/app/feedbacks) \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json'
```

### 応答例

```json
{
    "data": [
        {
            "id": "8c0fbed8-e2f9-49ff-9f0e-15a35bdd0e25",
            "app_id": "f252d396-fe48-450e-94ec-e184218e7346",
            "conversation_id": "2397604b-9deb-430e-b285-4726e51fd62d",
            "message_id": "709c0b0f-0a96-4a4e-91a4-ec0889937b11",
            "rating": "like",
            "content": "message feedback information-3",
            "from_source": "user",
            "from_end_user_id": "74286412-9a1a-42c1-929c-01edb1d381d5",
            "from_account_id": null,
            "created_at": "2025-04-24T09:24:38",
            "updated_at": "2025-04-24T09:24:38"
        }
    ]
}
```

---

## GET /messages/{message_id}/suggested

次の推奨質問。現在のメッセージに対する次の質問の提案を取得します。

### パスパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **message_id** | string | メッセージID |

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **user** | string | ユーザー識別子、エンドユーザーの身元を定義するために使用され、統計のために使用されます。 |

### リクエスト (GET /messages/{message_id}/suggested)

```bash
curl --location-request GET [https://api.dify.ai/v1/messages/](https://api.dify.ai/v1/messages/){message_id}/suggested \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json'
```

### 応答例

```json
{
    "result": "success",
    "data": [
        "a",
        "b",
        "c"
    ]
}
```

---

## GET /messages

会話履歴メッセージを取得。スクロールロード形式で履歴チャット記録を返し、最初のページは最新の `limit` メッセージを返します。つまり、逆順です。

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **conversation_id** | string | 会話ID |
| **user** | string | ユーザー識別子 |
| **first_id** | string | 現在のページの最初のチャット記録のID、デフォルトはnullです。 |
| **limit** | int | 1回のリクエストで返すチャット履歴メッセージの数、デフォルトは20です。 |

### 応答

| Name | Type | Description |
| :--- | :--- | :--- |
| **data** | array[object] | メッセージリスト<br>- `id` (string): メッセージID<br>- `conversation_id` (string): 会話ID<br>- `inputs` (object): ユーザー入力パラメータ<br>- `query` (string): ユーザー入力/質問内容<br>- `message_files` (array[object]): メッセージファイル<br>  - `id` (string): ID<br>  - `type` (string): ファイルタイプ、画像の場合は image<br>  - `url` (string): ファイルプレビューURL<br>  - `belongs_to` (string): 所属、user または assistant<br>- `answer` (string): 応答メッセージ内容<br>- `created_at` (timestamp): 作成タイムスタンプ<br>- `feedback` (object): フィードバック情報 (rating (string) like / dislike)<br>- `retriever_resources` (array[RetrieverResource]): 引用と帰属リスト |
| **has_more** | bool | 次のページがあるかどうか |
| **limit** | int | 返された項目数 |

### リクエスト例 (GET /messages)

```bash
curl -X GET '[https://api.dify.ai/v1/messages?user=abc-123&conversation_id=](https://api.dify.ai/v1/messages?user=abc-123&conversation_id=){conversation_id}' \
--header 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "limit": 20,
    "has_more": false,
    "data": [
        {
            "id": "a076a87f-31e5-48dc-b452-0061adbbc922",
            "conversation_id": "cd78daf6-f9e4-4463-9ff2-54257230a0ce",
            "inputs": {
                "name": "dify"
            },
            "query": "iphone 13 pro",
            "answer": "iPhone 13 Proは2021年9月24日に発売され、6.1インチのディスプレイと1170 x 2532...",
            "message_files": [],
            "feedback": null,
            "retriever_resources": [
                {
                    "position": 1,
                    "dataset_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb",
                    "dataset_name": "iPhone",
                    "document_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",
                    "document_name": "iPhone List",
                    "segment_id": "ed599c7f-2766-4294-9d1d-e5235061270a",
                    "score": 0.98457545,
                    "content": "\"Model\", \"Release Date\", \"Display Size\", \"Resolution\","
                }
            ],
            "created_at": 1705569239
        }
    ]
}
```

---

## GET /conversations

会話を取得。現在のユーザーの会話リストを取得し、デフォルトで最新の20件を返します。

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **user** | string | ユーザー識別子 |
| **last_id** | string | (Optional) 現在のページの最後の記録のID。デフォルトはnullです。 |
| **limit** | int | (Optional) 1回のリクエストで返す記録の数。デフォルトは最新の20件です。最大100、最小1。 |
| **sort_by** | string | (Optional) ソートフィールド、デフォルト: `-updated_at` (更新時間で降順にソート)。利用可能な値: `created_at`, `-created_at`, `updated_at`, `-updated_at` |

### 応答

| Name | Type | Description |
| :--- | :--- | :--- |
| **data** | array[object] | 会話のリスト<br>- `id` (string): 会話ID<br>- `name` (string): 会話名<br>- `inputs` (object): ユーザー入力パラメータ<br>- `introduction` (string): 紹介<br>- `created_at` (timestamp): 作成タイムスタンプ<br>- `updated_at` (timestamp): 更新タイムスタンプ |
| **has_more** | bool | 次のページがあるかどうか |
| **limit** | int | 返されたエントリ数 |

### リクエスト (GET /conversations)

```bash
curl -X GET '[https://api.dify.ai/v1/conversations?user=abc-123&last_id=&limit=20](https://api.dify.ai/v1/conversations?user=abc-123&last_id=&limit=20)' \
--header 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "limit": 20,
    "has_more": false,
    "data": [
        {
            "id": "10799fb8-64f7-4296-bbf7-b42bfbe0ae54",
            "name": "新しいチャット",
            "inputs": {
                "book": "book",
                "myName": "Lucy"
            },
            "status": "normal",
            "created_at": 1679667915,
            "updated_at": 1679667915
        }
    ]
}
```

---

## DELETE /conversations/:conversation_id

会話を削除。会話を削除します。

### パスパラメータ
`conversation_id` (string): 会話ID

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **user** | string | ユーザー識別子 |

### 応答
`204 No Content`

### リクエスト (DELETE /conversations/:conversation_id)

```bash
curl -X DELETE [https://api.dify.ai/v1/conversations/:conversation_id](https://api.dify.ai/v1/conversations/:conversation_id) \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {api_key}' \
--data '{
    "user": "abc-123"
}'
```

---

## POST /conversations/:conversation_id/name

会話の名前を変更。セッションの名前を変更します。

### パスパラメータ
`conversation_id` (string): 会話ID

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **name** | string | (Optional) 会話の名前。`auto_generate` が true の場合は省略可。 |
| **auto_generate** | bool | (Optional) タイトルを自動生成、デフォルトは false |
| **user** | string | ユーザー識別子 |

### 応答

| Name | Type | Description |
| :--- | :--- | :--- |
| **id** | string | 会話ID |
| **name** | string | 会話名 |
| **inputs** | object | ユーザー入力パラメータ |
| **status** | string | 会話状態 |
| **introduction** | string | 紹介 |
| **created_at** | timestamp | 作成タイムスタンプ |
| **updated_at** | timestamp | 更新タイムスタンプ |

### リクエスト (POST /conversations/:conversation_id/name)

```bash
curl -X POST [https://api.dify.ai/v1/conversations/:conversation_id/name](https://api.dify.ai/v1/conversations/:conversation_id/name) \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {api_key}' \
--data-raw '{
    "name": "",
    "auto_generate": true,
    "user": "abc-123"
}'
```

### 応答例

```json
{
    "id": "cd78daf6-f9e4-4463-9ff2-54257230a0ce",
    "name": "チャット vs AI",
    "inputs": {},
    "status": "normal",
    "introduction": "",
    "created_at": 1705569238,
    "updated_at": 1705569238
}
```

---

## GET /conversations/:conversation_id/variables

会話変数の取得。特定の会話から変数を取得します。

### パスパラメータ
`conversation_id` (string): 変数を取得する会話のID。

### クエリパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **user** | string | ユーザー識別子。 |
| **last_id** | string | (Optional) 現在のページの最後の記録のID、デフォルトはnull。 |
| **limit** | int | (Optional) 1回のリクエストで返す記録の数。デフォルトは20。最大100、最小1 |

### レスポンス

| Name | Type | Description |
| :--- | :--- | :--- |
| **limit** | int | ページごとのアイテム数 |
| **has_more** | bool | さらにアイテムがあるかどうか |
| **data** | array[object] | 変数のリスト<br>- `id` (string): 変数 ID<br>- `name` (string): 変数名<br>- `value_type` (string): 変数タイプ<br>- `value` (string): 変数値<br>- `description` (string): 変数の説明<br>- `created_at` (int): 作成タイムスタンプ<br>- `updated_at` (int): 最終更新タイムスタンプ |

### エラー
* 404: `conversation_not_exists`, 会話が見つかりません

### リクエスト (GET /conversations/:conversation_id/variables)

```bash
curl -X GET [https://api.dify.ai/v1/conversations/:conversation_id/variables](https://api.dify.ai/v1/conversations/:conversation_id/variables) \
--header 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "limit": 100,
    "has_more": false,
    "data": [
        {
            "id": "variable-uuid-1",
            "name": "customer_name",
            "value_type": "string",
            "value": "John Doe",
            "description": "会話から抽出された顧客名",
            "created_at": 1650000000000,
            "updated_at": 1650000000000
        },
        {
            "id": "variable-uuid-2",
            "name": "order_details",
            "value_type": "json",
            "value": "{\"product\":\"Widget\",\"quantity\":5,\"price\":19.99}",
            "description": "顧客の注文詳細",
            "created_at": 1650000000000,
            "updated_at": 1650000000000
        }
    ]
}
```

---

## PUT /conversations/:conversation_id/variables/:variable_id

会話変数の更新。特定の会話変数の値を更新します。

### パスパラメータ

| Name | Type | Description |
| :--- | :--- | :--- |
| **conversation_id** | string | 更新する変数を含む会話のID。 |
| **variable_id** | string | 更新する変数のID。 |

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **value** | any | 変数の新しい値。変数の期待される型と一致する必要があります。 |
| **user** | string | ユーザー識別子。 |

### レスポンス
更新された変数オブジェクトを返します。

| Name | Type | Description |
| :--- | :--- | :--- |
| **id** | string | 変数ID |
| **name** | string | 変数名 |
| **value_type** | string | 変数型 |
| **value** | any | 更新された変数値 |
| **description** | string | 変数の説明 |
| **created_at** | int | 作成タイムスタンプ |
| **updated_at** | int | 最終更新タイムスタンプ |

### エラー
* 400: `Type mismatch`, variable expects {expected_type}, but got {actual_type} type
* 404: `conversation_not_exists`, 会話が見つかりません
* 404: `conversation_variable_not_exists`, 変数が見つかりません

### リクエスト (PUT /conversations/:conversation_id/variables/:variable_id)

```bash
curl -X PUT [https://api.dify.ai/v1/conversations/:conversation_id/variables/:variable_id](https://api.dify.ai/v1/conversations/:conversation_id/variables/:variable_id) \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {api_key}' \
--data-raw '{
    "value": "Updated Value",
    "user": "abc-123"
}'
```

### 応答例

```json
{
    "id": "variable-uuid-1",
    "name": "customer_name",
    "value_type": "string",
    "value": "Updated Value",
    "description": "会話から抽出された顧客名",
    "created_at": 1650000000000,
    "updated_at": 1650000001000
}
```

---

## POST /audio-to-text

音声からテキストへ。このエンドポイントは `multipart/form-data` リクエストを必要とします。

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **file** | file | サポートされている形式: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']。ファイルサイズ制限: 15MB |
| **user** | string | ユーザー識別子 |

### 応答

| Name | Type | Description |
| :--- | :--- | :--- |
| **text** | string | 出力テキスト |

### リクエスト (POST /audio-to-text)

```bash
curl -X POST [https://api.dify.ai/v1/audio-to-text](https://api.dify.ai/v1/audio-to-text) \
--header 'Authorization: Bearer {api_key}' \
--form 'file=@localfile; type=audio/[mp3|mp4|mpeg|mpga|m4a|wav|webm]'
```

### 応答例

```json
{
    "text": "..."
}
```

---

## POST /text-to-audio

テキストから音声へ。テキストを音声に変換します。

### リクエストボディ

| Name | Type | Description |
| :--- | :--- | :--- |
| **message_id** | string | Difyによって生成されたテキストメッセージの場合、生成されたメッセージIDを直接渡します。message_id と text が同時に提供される場合、message_id が優先されます。 |
| **text** | string | 音声生成コンテンツ |
| **user** | string | ユーザー識別子 |

### リクエスト (POST /text-to-audio)

```bash
curl -o text-to-audio.mp3 -X POST [https://api.dify.ai/v1/text-to-audio](https://api.dify.ai/v1/text-to-audio) \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "message_id": "5ad4cb98-f0c7-4085-b384-88c403be6290",
    "text": "Hello Dify",
    "user": "abc-123"
}'
```

---

## GET /info

アプリケーションの基本情報を取得。このアプリケーションの基本情報を取得するために使用されます。

### レスポンス

| Name | Type | Description |
| :--- | :--- | :--- |
| **name** | string | アプリケーションの名前 |
| **description** | string | アプリケーションの説明 |
| **tags** | array[string] | アプリケーションのタグ |
| **mode** | string | アプリケーションのモード |
| **author_name** | string | 作者の名前 |

### リクエスト (GET /info)

```bash
curl -X GET [https://api.dify.ai/v1/info](https://api.dify.ai/v1/info) \
-H 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "name": "My App",
    "description": "This is my app.",
    "tags": [
        "tag1",
        "tag2"
    ],
    "mode": "advanced-chat",
    "author_name": "Dify"
}
```

---

## GET /parameters

アプリケーションのパラメータ情報を取得。ページに入る際に、機能、入力パラメータ名、タイプ、デフォルト値などの情報を取得するために使用されます。

### 応答
* `opening_statement` (string): 開始の挨拶
* `suggested_questions` (array[string]): 開始時の推奨質問のリスト
* `suggested_questions_after_answer` (object):
    * `enabled` (bool): 有効かどうか
* `speech_to_text` (object):
    * `enabled` (bool): 有効かどうか
* `text_to_speech` (object):
    * `enabled` (bool): 有効かどうか
    * `voice` (string): 音声タイプ
    * `language` (string): 言語
    * `autoPlay` (string): 自動再生(enabled / disabled)
* `retriever_resource` (object):
    * `enabled` (bool): 有効かどうか(引用と帰属)
* `annotation_reply` (object):
    * `enabled` (bool): 有効かどうか (注釈返信)
* `user_input_form` (array[object]): ユーザー入力フォームの設定
    * `text-input` (object) / `paragraph` (object) / `select` (object) ...
* `file_upload` (object): ファイルアップロード設定
    * `document` (object): (サポートタイプ: txt, md, pdf, html, xlsx, docx, csv, など)
        * `enabled` (bool): 有効かどうか
        * `number_limits` (int): ドキュメント数の上限
        * `transfer_methods` (array[string]): 転送方法リスト (remote_url, local_file)
    * `image` (object): (サポートタイプ: png, jpg, webp, gif)
        * `enabled` (bool): 有効かどうか
        * `number_limits` (int): 画像数の上限
        * `transfer_methods` (array[string]): 転送方法リスト
    * `audio` (object): (サポートタイプ: mp3, m4a, wav, webm, amr)
    * `video` (object): (サポートタイプ: mp4, mov, mpeg, mpga)
    * `custom` (object): その他のファイルタイプ
* `system_parameters` (object): システムパラメータ
    * `file_size_limit` (int): ドキュメントアップロードサイズ制限 (MB)
    * `image_file_size_limit` (int): 画像ファイルアップロードサイズ制限 (MB)
    * `audio_file_size_limit` (int): オーディオファイルアップロードサイズ制限 (MB)
    * `video_file_size_limit` (int): ビデオファイルアップロードサイズ制限 (MB)

### リクエスト (GET /parameters)

```bash
curl -X GET [https://api.dify.ai/v1/parameters](https://api.dify.ai/v1/parameters) \
-H 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "opening_statement": "こんにちは!",
    "suggested_questions_after_answer": {
        "enabled": true
    },
    "speech_to_text": {
        "enabled": true
    },
    "text_to_speech": {
        "enabled": true,
        "voice": "sambert-zhinan-v1",
        "language": "zh-Hans",
        "autoPlay": "disabled"
    },
    "retriever_resource": {
        "enabled": true
    },
    "annotation_reply": {
        "enabled": true
    },
    "user_input_form": [
        {
            "paragraph": {
                "label": "クエリ",
                "variable": "query",
                "required": true,
                "default": ""
            }
        }
    ],
    "file_upload": {
        "image": {
            "enabled": false,
            "number_limits": 3,
            "detail": "high",
            "transfer_methods": [
                "remote_url",
                "local_file"
            ]
        }
    },
    "system_parameters": {
        "file_size_limit": 15,
        "image_file_size_limit": 10,
        "audio_file_size_limit": 50,
        "video_file_size_limit": 100
    }
}
```

---

## GET /meta

アプリケーションのメタ情報を取得。このアプリケーションのツールのアイコンを取得するために使用されます。

### 応答
* `tool_icons` (object [string]): ツールアイコン
    * `tool_name` (string)
        * `icon` (object | string)
            * `background` (string): 背景色(16進数)
            * `content` (string): 絵文字
            * OR (string): アイコンのURL

### リクエスト (GET /meta)

```bash
curl -X GET [https://api.dify.ai/v1/meta](https://api.dify.ai/v1/meta) \
-H 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "tool_icons": {
        "dalle2": "[https://cloud.dify.ai/console/api/workspaces/current/tool-provider/builtin/dalle2/icon](https://cloud.dify.ai/console/api/workspaces/current/tool-provider/builtin/dalle2/icon)",
        "api_tool": {
            "background": "#252525",
            "content": "😀"
        }
    }
}
```

---

## GET /site

アプリのWebApp設定を取得。アプリのWebApp設定を取得するために使用します。

### 応答

| Name | Type | Description |
| :--- | :--- | :--- |
| **title** | string | WebApp名 |
| **chat_color_theme** | string | チャットの色テーマ (16進数) |
| **chat_color_theme_inverted** | bool | チャットの色テーマを反転するかどうか |
| **icon_type** | string | アイコンタイプ (emoji または image) |
| **icon** | string | アイコン (絵文字または画像URL) |
| **icon_background** | string | 16進数形式の背景色 |
| **icon_url** | string | アイコンのURL |
| **description** | string | 説明 |
| **copyright** | string | 著作権情報 |
| **privacy_policy** | string | プライバシーポリシーのリンク |
| **custom_disclaimer** | string | カスタム免責事項 |
| **default_language** | string | デフォルト言語 |
| **show_workflow_steps** | bool | ワークフローの詳細を表示するかどうか |
| **use_icon_as_answer_icon** | bool | WebApp のアイコンをチャット内の AI アイコンに置き換えるかどうか |

### リクエスト (GET /site)

```bash
curl -X GET [https://api.dify.ai/v1/site](https://api.dify.ai/v1/site) \
-H 'Authorization: Bearer {api_key}'
```

### 応答例

```json
{
    "title": "My App",
    "chat_color_theme": "#ff4a4a",
    "chat_color_theme_inverted": false
}
```