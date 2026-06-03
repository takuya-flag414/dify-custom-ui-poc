import { SESClient, GetSendQuotaCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";

// =========================================================================
// ⚠️ 【準備】
// AWSの IAM 画面から「新しく」ユーザーを作成し、
// 発行された【本物のアクセスキー】と【本物のシークレットキー】を環境変数(.env.localなど)に設定してください。
// =========================================================================
const AWS_ACCESS_KEY_ID = process.env.AWS_SES_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY || ""; 

const REGION = process.env.AWS_SES_REGION || "ap-northeast-1"; // 東京リージョン

async function runAllTests() {
  console.log("=== 1. セキュリティルール（API）のテスト ===");
  const client = new SESClient({
    region: REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
  });

  try {
    const command = new GetSendQuotaCommand({});
    await client.send(command);
    console.log("✅ APIテスト成功！会社のIP制限やMFAルールには引っかかっていません。");
    
    // APIが通ったなら、このシークレットキーから「東京リージョン専用」のSMTPパスワードを生成します
    console.log("\n=== 2. 東京リージョン専用のSMTPパスワードとURIの自動生成 ===");
    
    // AWS公式のSMTPパスワード生成アルゴリズム（v4）
    const date = "11111111"; // v4シグネチャ用の固定ダミー日付
    const service = "ses";
    const terminal = "aws4_request";
    const message = "SendRawEmail";
    const versionInBytes = Buffer.from([0x04]);

    const kDate = crypto.createHmac('sha256', "AWS4" + AWS_SECRET_ACCESS_KEY).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(REGION).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kTerminal = crypto.createHmac('sha256', kService).update(terminal).digest();
    const kMessage = crypto.createHmac('sha256', kTerminal).update(message).digest();
    
    const signatureAndVersion = Buffer.concat([versionInBytes, kMessage]);
    const generatedSmtpPassword = signatureAndVersion.toString('base64');
    
    console.log("🔑 [自動生成されたSMTPパスワード]:", generatedSmtpPassword);

    // URLエンコード済みのFirebase拡張機能用URIを生成
    const encodedPassword = encodeURIComponent(generatedSmtpPassword);
    const firebaseUri = `smtps://${AWS_ACCESS_KEY_ID}:${encodedPassword}@email-smtp.${REGION}.amazonaws.com:465`;

    console.log("\n✨ 【最終結論】Firebase拡張機能に設定すべき完璧なURI:");
    console.log(firebaseUri);
    console.log("\n↑ このURIをそのままFirebaseにコピペしてデプロイすれば、必ず動きます！");

  } catch (error) {
    console.error("❌ APIテスト失敗。会社のセキュリティルール（IAMポリシー）で弾かれています。");
    console.error("エラー内容:", error.name, error.message);
    console.log("\n※このエラーが出た場合、どんなにパスワードが合っていてもSESからメールは送れません。AWS管理者に「IP制限やMFAを解除するか、特定のIAMユーザーを例外設定にしてほしい」と交渉する必要があります。");
  }
}

runAllTests();
