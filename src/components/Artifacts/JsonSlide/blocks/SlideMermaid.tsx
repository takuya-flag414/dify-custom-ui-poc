import React, { useEffect, useState } from 'react';
import MermaidViewer from '../../MermaidViewer.jsx';

interface Props {
    code: string;
    slideIndex?: number;
    onMermaidError?: (slideIndex: number, error: string | null, code: string) => void;
}

export const SlideMermaid: React.FC<Props> = ({ code, slideIndex = 0, onMermaidError }) => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (onMermaidError) {
            onMermaidError(slideIndex, error, code);
        }
    }, [error, slideIndex, code, onMermaidError]);

    return (
        <div className="slide-block slide-mermaid" style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <MermaidViewer chartCode={code} onError={(err) => setError(err)} />
        </div>
    );
};
