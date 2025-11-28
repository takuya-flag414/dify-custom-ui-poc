import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createRoot } from 'react-dom/client';

// Simple reproduction of the issue
const content = "最低気温は**9℃の予想で、降水確率は10％**です";

const App = () => (
    <div>
        <h1>Markdown Reproduction</h1>
        <div id="output">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
        <hr />
        <h2>Control Group</h2>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {"**19℃**、"}
        </ReactMarkdown>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {"**晴れ**です"}
        </ReactMarkdown>
    </div>
);

// This is just a file to be read, not executed directly in this environment easily without a build step.
// But I can use the existing app to test this by modifying mockData or just inferring from the logic.
