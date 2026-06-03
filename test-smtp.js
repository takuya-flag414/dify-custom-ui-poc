// test-smtp.js
import nodemailer from 'nodemailer';

// ⚠️ 環境変数からSMTP情報を読み込むように変更しました。
// 環境変数 (例: .env.local) に AWS_SES_SMTP_USER, AWS_SES_SMTP_PASS などを設定してください。
const SMTP_USER = process.env.AWS_SES_SMTP_USER || '';
const SMTP_PASS = process.env.AWS_SES_SMTP_PASS || '';
const SMTP_HOST = process.env.AWS_SES_SMTP_HOST || 'email-smtp.ap-northeast-1.amazonaws.com';

async function testConnection() {
    console.log('接続テストを開始します...');
    
    // URIを使わず、個別のパラメータとして設定するスタンダードな方法
    let transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 465,
        secure: true, // 465ポートの場合はtrue
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }, // 回避用
    });

    try {
        await transporter.verify();
        console.log('✅ 成功: AWS SESのSMTPサーバーに正常にログインできました！');
        console.log('（この場合、認証情報は正しいため、Firebase拡張機能のURIの組み立て方に問題があります）');
    } catch (error) {
        console.error('❌ 失敗: ログインが拒否されました。');
        console.error(error);
        console.log('（この場合、パスワード自体が間違っているか、AWS IAM側でIPアドレス制限などがかかっている可能性があります）');
    }
}

testConnection();