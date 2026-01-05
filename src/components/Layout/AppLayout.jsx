// src/components/Layout/AppLayout.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * AppLayout - 4-Pane Grid Layout
 * DESIGN_RULE.md v3.0 "2.1 3-Pane Grid" 拡張版
 * 
 * Props:
 *   - sidebarCollapsed: サイドバー折りたたみ状態
 *   - inspectorOpen: Inspectorパネル表示状態
 *   - artifactOpen: ArtifactPanel表示状態
 *   - children: { sidebar, main, inspector, artifactPanel }
 */
const AppLayout = ({
    sidebarCollapsed = false,
    inspectorOpen = false,
    artifactOpen = false,
    sidebar,
    main,
    inspector,
    artifactPanel,
}) => {
    // サイドバー幅: 折りたたみ時68px、通常260px
    const sidebarWidth = sidebarCollapsed ? '68px' : '260px';

    // Inspector幅: 閉じている時0px、開いている時320px
    const inspectorWidth = inspectorOpen ? '320px' : '0px';

    // Artifact幅: 閉じている時0px、開いている時480px
    const artifactWidth = artifactOpen ? '480px' : '0px';

    return (
        <div
            className="app-layout-grid"
            style={{
                display: 'grid',
                gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr) ${inspectorWidth} ${artifactWidth}`,
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                backgroundColor: 'transparent', /* 親のグラデーション背景を透過 */
                transition: 'grid-template-columns 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                position: 'relative',
                zIndex: 1, /* グラデーション背景の上に配置 */
            }}
        >
            {/* Col 1: Sidebar (Fixed Width) - z-30 最前面 */}
            <aside
                className="app-layout-sidebar"
                style={{
                    position: 'relative',
                    zIndex: 30,
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                {sidebar}
            </aside>

            {/* Col 2: Main Content (Flexible) - z-10 最背面 */}
            <main
                className="app-layout-main"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    height: '100%',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {main}
            </main>

            {/* Col 3: Inspector (Collapsible) - z-20 中間 */}
            <aside
                className="app-layout-inspector"
                style={{
                    position: 'relative',
                    zIndex: 20,
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    opacity: inspectorOpen ? 1 : 0,
                    visibility: inspectorOpen ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                }}
            >
                {inspector}
            </aside>

            {/* Col 4: Artifact Panel (Collapsible) - z-25 */}
            <aside
                className="app-layout-artifact"
                style={{
                    position: 'relative',
                    zIndex: 25,
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    opacity: artifactOpen ? 1 : 0,
                    visibility: artifactOpen ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                }}
            >
                {artifactPanel}
            </aside>
        </div>
    );
};

export default AppLayout;
