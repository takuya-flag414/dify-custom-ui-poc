import React from 'react';
import { renderRichText } from './DocRichText';

const DocList = ({ block }) => {
    const { items = [], ordered = false } = block;
    const Tag = ordered ? 'ol' : 'ul';

    return (
        <Tag className={`doc-block-list ${ordered ? 'ordered' : 'unordered'}`}>
            {items.map((item, index) => (
                <li key={index} className="doc-list-item">
                    {renderRichText(item)}
                </li>
            ))}
        </Tag>
    );
};

export default DocList;
