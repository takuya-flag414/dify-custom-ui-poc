import React from 'react';

/**
 * DocLetterHeader
 * ビジネスレター（警告書など）の1ページ目上部用ヘッダーコンポーネント
 */
const DocLetterHeader = ({ block }) => {
    const meta = block.meta || {};
    const { title, date, refNo, recipient, sender } = meta;

    // 宛名情報のフォーマット化
    const renderRecipient = () => {
        if (!recipient) return null;
        if (typeof recipient === 'string') {
            return <div className="recipient-text">{recipient}</div>;
        }
        return (
            <div className="recipient-block">
                {recipient.postal && <div className="recipient-postal">{recipient.postal}</div>}
                {recipient.address && <div className="recipient-address">{recipient.address}</div>}
                {recipient.company && <div className="recipient-company">{recipient.company}</div>}
                {recipient.name && <div className="recipient-name">{recipient.name}</div>}
            </div>
        );
    };

    // 差出人情報のフォーマット化
    const renderSender = () => {
        if (!sender) return null;
        if (typeof sender === 'string') {
            return <div className="sender-text">{sender}</div>;
        }
        return (
            <div className="sender-block">
                {sender.postal && <div className="sender-postal">{sender.postal}</div>}
                {sender.address && <div className="sender-address">{sender.address}</div>}
                {sender.company && <div className="sender-company">{sender.company}</div>}
                {sender.department && <div className="sender-department">{sender.department}</div>}
            </div>
        );
    };

    return (
        <div className="doc-letter-header">
            {/* 上部: 文書番号と日付 (右寄せ) */}
            <div className="letter-meta-row">
                {refNo && <div className="letter-ref-no">{refNo}</div>}
                {date && <div className="letter-date">{date}</div>}
            </div>

            {/* 宛名 (左寄せ) */}
            <div className="letter-recipient-row">
                {renderRecipient()}
            </div>

            {/* 差出人 (右寄せ) */}
            <div className="letter-sender-row">
                {renderSender()}
            </div>

            {/* 下部: 件名 (中央揃え、下線などの装飾) */}
            <div className="letter-title-container">
                <h1 className="letter-title">{title}</h1>
            </div>
        </div>
    );
};

export default DocLetterHeader;
