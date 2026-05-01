const { KeyManagementServiceClient } = require('@google-cloud/kms');
const crypto = require('crypto');

// KMS クライアントの初期化
const client = new KeyManagementServiceClient();

/**
 * データを暗号化する (KMS)
 * @param {string} plaintext - 暗号化したい文字列
 * @returns {Promise<string>} - Base64エンコードされた暗号文
 */
async function encrypt(plaintext) {
    if (!plaintext) return null;
    const keyName = process.env.KMS_KEY_NAME;
    
    if (!keyName) {
        console.error('CRITICAL: KMS_KEY_NAME is not defined in environment variables.');
        throw new Error('KMS_KEY_NAME が設定されていません');
    }

    try {
        const [result] = await client.encrypt({
            name: keyName,
            plaintext: Buffer.from(plaintext),
        });
        return result.ciphertext.toString('base64');
    } catch (error) {
        console.error('KMS Encryption API Error:', error);
        throw error;
    }
}

/**
 * データを復号する (KMS)
 * @param {string} ciphertext - Base64エンコードされた暗号文
 * @returns {Promise<string>} - 復号された平文
 */
async function decrypt(ciphertext) {
    if (!ciphertext) return null;
    const keyName = process.env.KMS_KEY_NAME;

    if (!keyName) {
        console.error('CRITICAL: KMS_KEY_NAME is not defined in environment variables.');
        throw new Error('KMS_KEY_NAME が設定されていません');
    }

    try {
        const [result] = await client.decrypt({
            name: keyName,
            ciphertext: Buffer.from(ciphertext, 'base64'),
        });
        return result.plaintext.toString();
    } catch (error) {
        console.error('KMS Decryption API Error:', error);
        throw error;
    }
}

/**
 * 検索用のハッシュ値を生成する (SHA-256 + Salt)
 * @param {string} data - ハッシュ化したい文字列
 * @returns {string} - 16進数のハッシュ値
 */
function createSearchHash(data) {
    if (!data) return null;
    const salt = process.env.KMS_SEARCH_SALT || 'default-fallback-salt-change-me';
    return crypto
        .createHash('sha256')
        .update(data + salt)
        .digest('hex');
}

module.exports = {
    encrypt,
    decrypt,
    createSearchHash
};
