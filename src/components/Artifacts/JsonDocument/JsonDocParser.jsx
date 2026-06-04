import React from 'react';
import DocHeading from './blocks/DocHeading';
import DocRichText from './blocks/DocRichText';
import DocTable from './blocks/DocTable';
import DocSvg from './blocks/DocSvg';
import DocList from './blocks/DocList';
import DocChart from './blocks/DocChart';
import DocTOC from './blocks/DocTOC';
import DocCover from './blocks/DocCover';
import DocLetterHeader from './blocks/DocLetterHeader';
import DocMermaid from './blocks/DocMermaid';
import EditableBlockWrapper from './components/EditableBlockWrapper';

const BLOCK_COMPONENTS = {
    heading: DocHeading,
    rich_text: DocRichText,
    table: DocTable,
    svg: DocSvg,
    list: DocList,
    chart: DocChart,
    toc: DocTOC,
    cover: DocCover,
    letter_header: DocLetterHeader,
    mermaid: DocMermaid,
};

/**
 * JsonDocParser
 * ブロック配列を解析し、適切なコンポーネントを返却します。
 */
const JsonDocParser = ({ 
    blocks = [], 
    pageIndex,
    isEditMode = false, 
    selectedBlockIndex = null, 
    onBlockClick = () => {},
    onSendMessage
}) => {
    if (!blocks || blocks.length === 0) {
        return <div style={{ color: '#999', fontStyle: 'italic' }}>コンテンツがありません</div>;
    }

    return (
        <>
            {blocks.map((block, index) => {
                if (block.type === 'page_break') {
                    return null; // 改ページブロックはUI上表示しない
                }

                const Component = BLOCK_COMPONENTS[block.type];
                if (!Component) {
                    console.warn(`Unknown block type: ${block.type}`, block);
                    return <div key={index} style={{ color: 'red' }}>Unsupported block: {block.type}</div>;
                }
                
                return (
                    <EditableBlockWrapper
                        key={index}
                        isEditMode={isEditMode}
                        isSelected={selectedBlockIndex === index}
                        onClick={() => onBlockClick(index)}
                    >
                        <div id={`json-doc-block-${pageIndex}-${index}-${block.type}`}>
                            <Component block={block} onSendMessage={onSendMessage} />
                        </div>
                    </EditableBlockWrapper>
                );
            })}
        </>
    );
};

export default JsonDocParser;
