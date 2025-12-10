/**
 * Dify APIに送信するために会話履歴をテキスト形式に整形します。
 * ファイル添付があった場合、ファイル名を明記して文脈を補完します。
 * * @param {Array} messages - useChatのmessagesステート
 * @param {number} charLimit - 最大文字数
 * @returns {string} 整形された会話履歴テキスト
 */
export const formatConversationHistory = (messages, charLimit = 2500) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        return '';
    }

    let formattedHistory = '';
    let currentLength = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];

        if (msg.id === 'err' || (!msg.text && (!msg.files || msg.files.length === 0))) continue;

        const roleLabel = msg.role === 'user' ? 'User' : 'AI';

        let fileContext = '';
        if (msg.files && Array.isArray(msg.files) && msg.files.length > 0) {
            // ファイル名を抽出して結合
            const fileNames = msg.files.map(f => f.name || 'ドキュメント').join(', ');
            fileContext = `[添付ファイル: ${fileNames}]\n`;
        }

        const content = msg.text ? msg.text.trim() : '';

        // "User: [添付ファイル: 議事録.pdf]\nお願いします..." のような形式にする
        const entry = `${roleLabel}: ${fileContext}${content}\n\n`;

        if (currentLength + entry.length > charLimit) {
            break;
        }

        formattedHistory = entry + formattedHistory;
        currentLength += entry.length;
    }

    return formattedHistory.trim();
};