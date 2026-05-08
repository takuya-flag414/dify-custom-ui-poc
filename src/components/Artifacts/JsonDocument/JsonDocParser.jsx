import React from 'react';
import DocHeading from './blocks/DocHeading';
import DocRichText from './blocks/DocRichText';
import DocTable from './blocks/DocTable';
import DocSvg from './blocks/DocSvg';
import DocList from './blocks/DocList';
import DocChart from './blocks/DocChart';
import DocTOC from './blocks/DocTOC';
import DocCover from './blocks/DocCover';
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
};

/**
 * JsonDocParser
 * ブロック配列を解析し、適切なコンポーネントを返却します。
 */
const JsonDocParser = ({ 
    blocks = [], 
    isEditMode = false, 
    selectedBlockIndex = null, 
    onBlockClick = () => {} 
}) => {
    if (!blocks || blocks.length === 0) {
        return <div style={{ color: '#999', fontStyle: 'italic' }}>コンテンツがありません</div>;
    }

    return (
        <>
            {blocks.map((block, index) => {
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
                        <Component block={block} />
                    </EditableBlockWrapper>
                );
            })}
        </>
    );
};

export default JsonDocParser;
