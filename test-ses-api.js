import { SESClient, GetSendQuotaCommand } from "@aws-sdk/client-ses";

// ⚠️【重要】
// AWS SDK（API）では、SMTP用のパスワード（BKf/MG...のような文字列）は使えません！
// 必ず、AWSコンソールから取得した元の「IAMシークレットアクセスキー」を設定してください。
// 環境変数 (例: .env.local) から読み込むように変更しました。
const AWS_ACCESS_KEY_ID = process.env.AWS_SES_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY || ""; 

// SESのリージョンを指定します（SMTPのエンドポイントに合わせてap-northeast-1としています）
const REGION = process.env.AWS_SES_REGION || "ap-northeast-1";

async function testSESApi() {
  console.log("AWS SES APIへの接続テストを開始します...");

  const client = new SESClient({
    region: REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // SESの送信クォータ（送信可能枠）を取得するAPIを叩いて、認証されるかテストします
    const command = new GetSendQuotaCommand({});
    const response = await client.send(command);
    
    console.log("✅ 成功: API認証にパスしました！");
    console.log("APIが通ったということは、IP制限やMFAは原因ではありません。");
    console.log("もしAPIは成功してSMTPが失敗する場合、SMTPパスワードの発行手順が間違っていた可能性が高いです。");
    console.dir(response, { depth: null });
    
  } catch (error) {
    console.error("❌ 失敗: APIリクエストが拒否されました。");
    console.error("【詳細な拒否理由（このメッセージが最重要です）】");
    
    // AWSが返す生のエラーを出力します
    if (error.name) {
      console.error(`エラーの種類: ${error.name}`);
    }
    if (error.message) {
      console.error(`エラーメッセージ: ${error.message}`);
    }
    
    console.log("\n=====================");
    console.log("💡 ヒント:");
    console.log("- 'Explicit deny in a service control policy' などの場合: 会社のIP制限やセキュリティルールに引っかかっています。");
    console.log("- 'MultiFactorAuthAge is null' などの場合: MFAの強制ルールに引っかかっています。");
    console.log("- 'InvalidSignatureException' などの場合: シークレットキーが間違っています（SMTPパスワードをそのまま入れていませんか？）。");
  }
}

testSESApi();
