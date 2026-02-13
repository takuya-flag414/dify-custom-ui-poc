// src/components/Shared/FileIcon.d.ts
import React from 'react';

interface FileIconProps {
    filename: string;
    className?: string;
}

declare const FileIcon: React.FC<FileIconProps>;
export default FileIcon;
