import React from 'react';

const DocHeading = ({ block }) => {
    const { level = 1, text } = block;
    const Tag = `h${level > 3 ? 3 : level}`;
    const className = `doc-block-heading-${level}`;

    return <Tag className={className}>{text}</Tag>;
};

export default DocHeading;
