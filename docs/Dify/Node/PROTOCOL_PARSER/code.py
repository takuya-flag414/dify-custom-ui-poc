import json

def main(raw_input: str) -> dict:
    """
    Desktop Intelligence Protocol Parser v2.4 (Artifact Support)
    Safe for both JSON Protocol (Frontend) and Plain Text (Dify Debug).
    """
    
    # 1. デフォルト値の初期化
    extracted_text = ""
    extracted_store_id = ""
    extracted_store_name = ""
    extracted_quote = ""
    extracted_is_artifact = "false"   # [追加]
    extracted_artifact_type = ""      # [追加]
    extracted_custom_bot_system_prompt = "" # [追加: カスタムボットシステムプロンプト]

    # 2. 入力が空(None)の場合のガード
    if raw_input is None:
        return {
            "text": "",
            "gemini_store_id": "",
            "gemini_store_name": "",
            "quote": "",
            "is_artifact": "false",   # [追加]
            "artifact_type": "",      # [追加]
            "custom_bot_system_prompt": "" # [追加]
        }

    # 入力を文字列化してとりあえずテキストとして保持 (デバッグ用)
    extracted_text = str(raw_input)

    try:
        # 3. JSONパースの試行
        data = json.loads(raw_input)
        
        # パース成功し、かつ辞書型である場合のみ構造解析を行う
        if isinstance(data, dict):
            
            # --- Text Extraction ---
            content_block = data.get("content")
            if isinstance(content_block, dict):
                extracted_text = content_block.get("text", "")
            elif isinstance(content_block, str):
                extracted_text = content_block
            
            # --- Store ID Extraction ---
            dify_inputs = data.get("dify_inputs")
            if isinstance(dify_inputs, dict):
                if "gemini_store_id" in dify_inputs:
                    extracted_store_id = dify_inputs["gemini_store_id"]
            
            # Fallback to Context ID
            if not extracted_store_id:
                context = data.get("context")
                if isinstance(context, dict):
                    selected_ids = context.get("selected_store_ids")
                    if isinstance(selected_ids, list) and len(selected_ids) > 0:
                        extracted_store_id = selected_ids[0]

            # --- Store Name Extraction ---
            context = data.get("context")
            if isinstance(context, dict):
                selected_names = context.get("selected_store_names")
                if isinstance(selected_names, list) and len(selected_names) > 0:
                    extracted_store_name = selected_names[0]

            # --- Quote Extraction ---
            if "quote" in data and isinstance(data["quote"], str):
                extracted_quote = data["quote"]

            # --- Artifact Extraction ---                          # [追加]
            artifact = data.get("artifact")                        # [追加]
            if isinstance(artifact, dict):                         # [追加]
                if artifact.get("requested") is True:              # [追加]
                    extracted_is_artifact = "true"                 # [追加]
                extracted_artifact_type = artifact.get("type", "") # [追加]

            # --- Custom Bot System Prompt Extraction ---
            custom_bot = data.get("custom_bot")
            if isinstance(custom_bot, dict):
                extracted_custom_bot_system_prompt = custom_bot.get("system_prompt", "")

            # --- Has Received Artifact Extraction (Enhanced) ---
            artifact_types = [
                'html_document', 'html_slide', 'summary_report', 
                'checklist', 'comparison_table', 'faq', 'meeting_minutes'
            ]
            received_flags = {}
            extracted_has_received_artifact = "false"
            
            dify_inputs = data.get("dify_inputs")
            if isinstance(dify_inputs, dict):
                # 共通フラグの取得
                common_val = dify_inputs.get("has_received_artifact")
                extracted_has_received_artifact = "true" if common_val in [True, "true"] else "false"
                
                # タイプ別フラグの抽出とフォールバック
                for t in artifact_types:
                    key = f"has_received_{t}"
                    val = dify_inputs.get(key)
                    if val is not None:
                        received_flags[key] = "true" if val in [True, "true"] else "false"
                    else:
                        # フォールバック: 個別フラグがない場合は共通フラグに従う
                        received_flags[key] = extracted_has_received_artifact
            else:
                # dify_inputsがない場合のデフォルト
                for t in artifact_types:
                    received_flags[f"has_received_{t}"] = "false"

    except (json.JSONDecodeError, TypeError):
        # JSONでない場合のデフォルト値セット
        artifact_types = ['html_document', 'html_slide', 'summary_report', 'checklist', 'comparison_table', 'faq', 'meeting_minutes']
        received_flags = {f"has_received_{t}": "false" for t in artifact_types}
        extracted_has_received_artifact = "false"
    except Exception as e:
        print(f"Parser Warning: {e}")
        artifact_types = ['html_document', 'html_slide', 'summary_report', 'checklist', 'comparison_table', 'faq', 'meeting_minutes']
        received_flags = {f"has_received_{t}": "false" for t in artifact_types}
        extracted_has_received_artifact = "false"

    # 4. 結果の返却
    return {
        "text": extracted_text,
        "gemini_store_id": extracted_store_id,
        "gemini_store_name": extracted_store_name,
        "quote": extracted_quote,
        "is_artifact": extracted_is_artifact,
        "artifact_type": extracted_artifact_type,
        "custom_bot_system_prompt": extracted_custom_bot_system_prompt,
        "has_received_artifact": extracted_has_received_artifact,
        # 個別フラグを明示的に設定
        "has_received_html_document": received_flags.get("has_received_html_document", "false"),
        "has_received_html_slide": received_flags.get("has_received_html_slide", "false"),
        "has_received_summary_report": received_flags.get("has_received_summary_report", "false"),
        "has_received_checklist": received_flags.get("has_received_checklist", "false"),
        "has_received_comparison_table": received_flags.get("has_received_comparison_table", "false"),
        "has_received_faq": received_flags.get("has_received_faq", "false"),
        "has_received_meeting_minutes": received_flags.get("has_received_meeting_minutes", "false")
    }