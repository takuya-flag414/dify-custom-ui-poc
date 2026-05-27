# ワークフローアプリ API

ワークフローアプリケーションは、セッションをサポートせず、翻訳、記事作成、要約 AI などに最適です。



## 認証

サービス API は `API-Key` 認証を使用します。API キーの漏洩を防ぐため、API キーはクライアント側で共有または保存せず、サーバー側で保存することを強くお勧めします。

すべての API リクエストにおいて、以下のように `Authorization` HTTP ヘッダーに API キーを含めてください：

```http
Authorization: Bearer {API_KEY}

```

---

## POST /workflows/run

### ワークフローを実行

ワークフローを実行します。公開されたワークフローがないと実行できません。

### リクエストボディ

* **inputs** (object) **必須**
* アプリで定義されたさまざまな変数値の入力を許可します。`inputs` パラメータには複数のキー/値ペアが含まれ、各キーは特定の変数に対応し、各値はその変数の特定の値です。
* ワークフローアプリケーションは少なくとも1つのキー/値ペアの入力を必要とします。
* 値はファイルリストである場合もあります。ファイルリストは、テキスト理解と質問への回答を組み合わせたファイルの入力に適しています。モデルがファイルの解析と理解機能をサポートしている場合にのみ使用できます。
* 変数がファイルリストの場合、リストの各要素は以下の属性を持つ必要があります。
* `type` (string): サポートされるタイプ `document`。
* 詳細タイプ: 'TXT', 'MD', 'MARKDOWN', 'MDX', 'PDF', 'HTML', 'XLSX', 'XLS', 'VTT', 'PROPERTIES', 'DOC', 'DOCX', 'CSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB'
* `image`: 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'
* `audio`: 'MP3', 'M4A', 'WAV', 'WEBM', 'MPGA'
* `video`: 'MP4', 'MOV', 'MPEG', 'WEBM'
* `custom`: その他のファイルタイプ


* `transfer_method` (string): 転送方法
* `remote_url`: ファイルのURL。
* `local_file`: ファイルをアップロード。


* `url`: ファイルのURL。（転送方法が `remote_url` の場合のみ）。
* `upload_file_id`: アップロードされたファイルID。（転送方法が `local_file` の場合のみ）。




* **response_mode** (string) **必須**
* 応答の返却モードを指定します。サポートされているモード：
* `streaming`: ストリーミングモード（推奨）、SSE（Server-Sent Events）を通じてタイプライターのような出力を実装します。
* `blocking`: ブロッキングモード、実行完了後に結果を返します。（プロセスが長い場合、リクエストが中断される可能性があります） Cloudflare の制限により、100 秒後に応答がない場合、リクエストは中断されます。


* **user** (string) **必須**
* ユーザー識別子、エンドユーザーのアイデンティティを定義するために使用されます。アプリケーション内で開発者によって一意に定義される必要があります。


* **files** (array[object]) オプション
* **trace_id** (string) オプション
* トレースID。既存の業務システムのトレースコンポーネントと連携し、エンドツーエンドの分散トレーシングを実現するために使用します。指定がない場合、システムが自動的に `trace_id` を生成します。以下の3つの方法で渡すことができ、優先順位は次のとおりです：
1. Header：HTTPヘッダー `X-Trace-Id` で渡す（最優先）。
2. クエリパラメータ：URLクエリパラメータ `trace_id` で渡す。
3. リクエストボディ：リクエストボディの `trace_id` フィールドで渡す（本フィールド）。





### 応答

`response_mode` が `blocking` の場合、`CompletionResponse` オブジェクトを返します。
`response_mode` が `streaming` の場合、`ChunkCompletionResponse` ストリームを返します。

#### CompletionResponse

アプリの結果を返します。Content-Typeは `application/json` です。

* `workflow_run_id` (string): ワークフロー実行の一意の ID
* `task_id` (string): タスク ID、リクエスト追跡と以下の Stop Generate API に使用
* `data` (object): 結果の詳細
* `id` (string): ワークフロー実行の ID
* `workflow_id` (string): 関連するワークフローの ID
* `status` (string): 実行のステータス (`running` / `succeeded` / `failed` / `stopped`)
* `outputs` (json): オプションの出力内容
* `error` (string): オプションのエラー理由
* `elapsed_time` (float): オプションの使用時間（秒）
* `total_tokens` (int): オプションの使用トークン数
* `total_steps` (int): デフォルト 0
* `created_at` (timestamp): 開始時間
* `finished_at` (timestamp): 終了時間



#### ChunkCompletionResponse

アプリによって出力されたストリームチャンクを返します。Content-Typeは `text/event-stream` です。
各ストリーミングチャンクは `data:` で始まり、2 つの改行文字 `\n\n` で区切られます。

例:

```
data: {"event": "text_chunk", "workflow_run_id": "...", "task_id": "...", "data": {"text": "...", "from_variable_selector": [...]}}


```

ストリーミングチャンクの構造は `event` に応じて異なります：

* **event: workflow_started** (ワークフローが実行を開始)
* `task_id`, `workflow_run_id`, `event` ("workflow_started"), `data` (id, workflow_id, created_at)


* **event: node_started** (ノード実行開始)
* `node_id`, `node_type`, `title`, `index`, `predecessor_node_id`, `inputs`, `created_at`


* **event: text_chunk** (テキストフラグメント)
* `text`, `from_variable_selector`


* **event: node_finished** (ノード実行終了)
* `node_id`, `node_type`, `status`, `outputs`, `execution_metadata`, `elapsed_time`


* **event: workflow_finished** (ワークフロー実行終了)
* `status`, `outputs`, `total_tokens`, `elapsed_time`


* **event: tts_message** (TTS オーディオストリーム)
* `audio` (base64文字列), `message_id`


* **event: tts_message_end** (TTS 終了)
* **event: ping** (10秒ごとのPing)

#### エラーコード

* 400, `invalid_param`: 異常なパラメータ入力
* 400, `app_unavailable`: アプリの設定が利用できません
* 400, `provider_not_initialize`: 利用可能なモデル資格情報の設定がありません
* 400, `provider_quota_exceeded`: モデル呼び出しのクォータが不足しています
* 400, `model_currently_not_support`: 現在のモデルは利用できません
* 400, `workflow_request_error`: ワークフロー実行に失敗しました
* 500: 内部サーバーエラー

### リクエスト例 (curl)

```bash
curl -X POST '[https://api.dify.ai/v1/workflows/run](https://api.dify.ai/v1/workflows/run)' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'

```

#### ファイル変数の例

```json
{
  "inputs": {
    "{variable_name}":
    [
      {
      "transfer_method": "local_file",
      "upload_file_id": "{upload_file_id}",
      "type": "{document_type}"
      }
    ]
  }
}

```

### 応答例

#### ブロッキングモード

```json
{
    "workflow_run_id": "djflajgkldjgd",
    "task_id": "9da23599-e713-473b-982c-4328d4f5c78a",
    "data": {
        "id": "fdlsjfjejkghjda",
        "workflow_id": "fldjaslkfjlsda",
        "status": "succeeded",
        "outputs": {
          "text": "Nice to meet you."
        },
        "error": null,
        "elapsed_time": 0.875,
        "total_tokens": 3562,
        "total_steps": 8,
        "created_at": 1705407629,
        "finished_at": 1727807631
    }
}

```

#### ストリーミングモード

```json
data: {"event": "workflow_started", "task_id": "...", "workflow_run_id": "...", "data": {"id": "...", "workflow_id": "...", "created_at": 1679586595}}
data: {"event": "node_started", ...}
data: {"event": "node_finished", ...}
data: {"event": "workflow_finished", ...}

```

### ファイルアップロードのサンプルコード (Python)

```python
import requests
import json

def upload_file(file_path, user):
    upload_url = "[https://api.dify.ai/v1/files/upload](https://api.dify.ai/v1/files/upload)"
    headers = {
        "Authorization": "Bearer app-xxxxxxxx",
    }

    try:
        print("ファイルをアップロードしています...")
        with open(file_path, 'rb') as file:
            files = {
                'file': (file_path, file, 'text/plain')  # ファイルが適切な MIME タイプでアップロードされていることを確認してください
            }
            data = {
                "user": user,
                "type": "TXT"  # ファイルタイプをTXTに設定します
            }

            response = requests.post(upload_url, headers=headers, files=files, data=data)
            if response.status_code == 201:  # 201 は作成が成功したことを意味します
                print("ファイルが正常にアップロードされました")
                return response.json().get("id")  # アップロードされたファイルIDを取得する
            else:
                print(f"ファイルのアップロードに失敗しました。ステータス コード: {response.status_code}")
                return None
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        return None

def run_workflow(file_id, user, response_mode="blocking"):
    workflow_url = "[https://api.dify.ai/v1/workflows/run](https://api.dify.ai/v1/workflows/run)"
    headers = {
        "Authorization": "Bearer app-xxxxxxxxx",
        "Content-Type": "application/json"
    }

    data = {
        "inputs": {
            "orig_mail": [{
                "transfer_method": "local_file",
                "upload_file_id": file_id,
                "type": "document"
            }]
        },
        "response_mode": response_mode,
        "user": user
    }

    try:
        print("ワークフローを実行...")
        response = requests.post(workflow_url, headers=headers, json=data)
        if response.status_code == 200:
            print("ワークフローが正常に実行されました")
            return response.json()
        else:
            print(f"ワークフローの実行がステータス コードで失敗しました: {response.status_code}")
            return {"status": "error", "message": f"Failed to execute workflow, status code: {response.status_code}"}
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        return {"status": "error", "message": str(e)}

# 使用例
file_path = "{your_file_path}"
user = "difyuser"

# ファイルをアップロードする
file_id = upload_file(file_path, user)
if file_id:
    # ファイルは正常にアップロードされました。ワークフローの実行を続行します
    result = run_workflow(file_id, user)
    print(result)
else:
    print("ファイルのアップロードに失敗し、ワークフローを実行できません")

```

---

## POST /workflows/:workflow_id/run

### 特定バージョンのワークフローを実行

パスパラメータでワークフローIDを指定して、特定バージョンのワークフローを実行します。

### パスパラメータ

* **workflow_id** (string) **必須**: 特定バージョンのワークフローを指定するためのワークフローID。
* *取得方法*：バージョン履歴インターフェースで、各バージョンエントリの右側にあるコピーアイコンをクリックすると、完全なワークフローIDをコピーできます。



### リクエストボディ

(`POST /workflows/run` と同様)

* **inputs** (object) **必須**
* **response_mode** (string) **必須**: `streaming` / `blocking`
* **user** (string) **必須**
* **files** (array[object]) オプション
* **trace_id** (string) オプション

### 応答

(`POST /workflows/run` と同様)

### リクエスト例

```bash
curl -X POST '[https://api.dify.ai/v1/workflows/](https://api.dify.ai/v1/workflows/){workflow_id}/run' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'

```

---

## GET /workflows/run/:workflow_run_id

### ワークフロー実行詳細を取得

ワークフロー実行 ID に基づいて、ワークフロータスクの現在の実行結果を取得します。

### パスパラメータ

* **workflow_run_id** (string): ワークフロー実行ID、ストリーミングチャンクの返り値から取得可能

### 応答

* `id` (string): ワークフロー実行の ID
* `workflow_id` (string): 関連するワークフローの ID
* `status` (string): 実行のステータス (`running` / `succeeded` / `failed` / `stopped`)
* `inputs` (json): 入力内容
* `outputs` (json): 出力内容
* `error` (string): エラー理由
* `total_steps` (int): タスクの総ステップ数
* `total_tokens` (int): 使用されるトークンの総数
* `created_at` (timestamp): 開始時間
* `finished_at` (timestamp): 終了時間
* `elapsed_time` (float): 使用される総秒数

### リクエスト例

```bash
curl -X GET '[https://api.dify.ai/v1/workflows/run/:workflow_run_id](https://api.dify.ai/v1/workflows/run/:workflow_run_id)' \
-H 'Authorization: Bearer {api_key}' \
-H 'Content-Type: application/json'

```

### 応答例

```json
{
    "id": "b1ad3277-089e-42c6-9dff-6820d94fbc76",
    "workflow_id": "19eff89f-ec03-4f75-b0fc-897e7effea02",
    "status": "succeeded",
    "inputs": "{\"sys.files\": [], \"sys.user_id\": \"abc-123\"}",
    "outputs": null,
    "error": null,
    "total_steps": 3,
    "total_tokens": 0,
    "created_at": 1705407629,
    "finished_at": 1727807631,
    "elapsed_time": 30.098514399956912
}

```

---

## POST /workflows/tasks/:task_id/stop

### 生成を停止

ストリーミングモードでのみサポートされています。

### パスパラメータ

* **task_id** (string): タスク ID、ストリーミングチャンクの返り値から取得可能

### リクエストボディ

* **user** (string) **必須**: ユーザー識別子

### 応答

* `result` (string): 常に "success" を返します

### リクエスト例

```bash
curl -X POST '[https://api.dify.ai/v1/workflows/tasks/:task_id/stop](https://api.dify.ai/v1/workflows/tasks/:task_id/stop)' \
-H 'Authorization: Bearer {api_key}' \
-H 'Content-Type: application/json' \
--data-raw '{"user": "abc-123"}'

```

### 応答例

```json
{
  "result": "success"
}

```

---

## POST /files/upload

### ファイルアップロード

メッセージ送信時に使用するためのファイルをアップロードし、画像とテキストのマルチモーダル理解を可能にします。ワークフローでサポートされている任意の形式をサポートします。

### リクエストボディ

このインターフェースは `multipart/form-data` リクエストを必要とします。

* **file** (File) **必須**: アップロードするファイル。
* **user** (string) **必須**: ユーザー識別子。

### 応答

アップロードが成功すると、サーバーはファイルの ID と関連情報を返します。

* `id` (uuid): ID
* `name` (string): ファイル名
* `size` (int): ファイルサイズ（バイト）
* `extension` (string): ファイル拡張子
* `mime_type` (string): ファイルの MIME タイプ
* `created_by` (uuid): エンドユーザーID
* `created_at` (timestamp): 作成タイムスタンプ

### エラー

* 400, `no_file_uploaded`: ファイルが提供されていません
* 400, `too_many_files`: 現在は 1 つのファイルのみ受け付けています
* 400, `unsupported_preview`: ファイルはプレビューをサポートしていません
* 400, `unsupported_estimate`: ファイルは推定をサポートしていません
* 413, `file_too_large`: ファイルが大きすぎます
* 415, `unsupported_file_type`: サポートされていない拡張子
* 503, `s3_connection_failed` / `s3_permission_denied` / `s3_file_too_large`

### リクエスト例

```bash
curl -X POST '[https://api.dify.ai/v1/files/upload](https://api.dify.ai/v1/files/upload)' \
--header 'Authorization: Bearer {api_key}' \
--form 'file=@localfile;type=image/[png|jpeg|jpg|webp|gif]' \
--form 'user=abc-123'

```

### 応答例

```json
{
  "id": "72fa9618-8f89-4a37-9b33-7e1178a24a67",
  "name": "example.png",
  "size": 1024,
  "extension": "png",
  "mime_type": "image/png",
  "created_by": "6ad1ab0a-73ff-4ac1-b9e4-cdb312f71f13",
  "created_at": 1577836800
}

```

---

## GET /workflows/logs

### ワークフローログを取得

### クエリパラメータ

| Name | Type | Description |
| --- | --- | --- |
| **keyword** | string | 検索するキーワード |
| **status** | string | `succeeded` / `failed` / `stopped` |
| **page** | int | 現在のページ、デフォルトは1 |
| **limit** | int | 1回のリクエストで返すチャット履歴メッセージの数、デフォルトは20 |
| **created_by_end_user_session_id** | str | どのendUserによって作成されたか、例えば、abc-123 |
| **created_by_account** | str | どのメールアカウントによって作成されたか、例えば、lizb@test.com |

### 応答

* `page`, `limit`, `total`, `has_more`
* `data` (array[object]): ログリスト
* `id`, `workflow_run`, `version`, `status`, `error`, `elapsed_time`, `total_tokens`
* `created_from`, `created_by_role`, `created_by_account`
* `created_by_end_user`, `created_at`



### リクエスト例

```bash
curl -X GET '[https://api.dify.ai/v1/workflows/logs](https://api.dify.ai/v1/workflows/logs)'\
--header 'Authorization: Bearer {api_key}'

```

### 応答例

```json
{
    "page": 1,
    "limit": 1,
    "total": 7,
    "has_more": true,
    "data": [
        {
            "id": "e41b93f1-7ca2-40fd-b3a8-999aeb499cc0",
            "workflow_run": {
                "id": "c0640fc8-03ef-4481-a96c-8a13b732a36e",
                "version": "2024-08-01 12:17:09.771832",
                "status": "succeeded",
                "error": null,
                "elapsed_time": 1.3588523610014818,
                "total_tokens": 0,
                "total_steps": 3,
                "created_at": 1726139643,
                "finished_at": 1726139644
            },
            "created_from": "service-api",
            "created_by_role": "end_user",
            "created_by_account": null,
            "created_by_end_user": {
                "id": "7f7d9117-dd9d-441d-8970-87e5e7e687a3",
                "type": "service_api",
                "is_anonymous": false,
                "session_id": "abc-123"
            },
            "created_at": 1726139644
        }
    ]
}

```

---

## GET /info

### アプリケーションの基本情報を取得

### 応答

* `name` (string): アプリケーションの名前
* `description` (string): アプリケーションの説明
* `tags` (array[string]): アプリケーションのタグ
* `mode` (string): アプリケーションのモード
* `author_name` (string): 作者の名前

### リクエスト例

```bash
curl -X GET '[https://api.dify.ai/v1/info](https://api.dify.ai/v1/info)' \
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
  "mode": "workflow",
  "author_name": "Dify"
}

```

---

## GET /parameters

### アプリケーションのパラメータ情報を取得

### 応答

* `user_input_form` (array[object]): ユーザー入力フォームの設定 (`text-input`, `paragraph`, `select`, `file_upload` 等の詳細設定)
* `system_parameters` (object): システムパラメータ (`file_size_limit` 等)

### リクエスト例

```bash
curl -X GET '[https://api.dify.ai/v1/parameters](https://api.dify.ai/v1/parameters)'

```

### 応答例

```json
{
  "user_input_form": [
      {
          "paragraph": {
              "label": "Query",
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

## GET /site

### アプリのWebApp設定を取得

### 応答

* `title` (string): WebApp 名
* `icon_type`, `icon`, `icon_background`, `icon_url`
* `description`, `copyright`, `privacy_policy`, `custom_disclaimer`
* `default_language`
* `show_workflow_steps`

### リクエスト例

```bash
curl -X GET '[https://api.dify.ai/v1/site](https://api.dify.ai/v1/site)' \
-H 'Authorization: Bearer {api_key}'

```

### 応答例

```json
{
  "title": "My App",
  "icon_type": "emoji",
  "icon": "😄",
  "icon_background": "#FFEAD5",
  "icon_url": null,
  "description": "This is my app.",
  "copyright": "all rights reserved",
  "privacy_policy": "",
  "custom_disclaimer": "All generated by AI",
  "default_language": "en-US",
  "show_workflow_steps": false
}

```

```

