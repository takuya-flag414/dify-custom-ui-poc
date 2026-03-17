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
    sidebar,
    main,
    inspector,
}) => {
    // サイドバー幅: 折りたたみ時68px、通常260px
    const sidebarWidth = sidebarCollapsed ? '68px' : '260px';

    return (
        <div
            className="app-layout-grid"
            style={{
                display: 'grid',
                // Inspectorをグリッドから除外 (Sidebar | Main)
                gridTemplateColumns: `${sidebarWidth} minmax(0, 1fr)`,
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

                {/* Floating Inspector (Overlay on Main) - z-20 */}
                <aside
                    className="app-layout-inspector-floating"
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '0px', // InspectorPanel側でサイズ制御するためコンテナは最小限にしないとクリック透過できない可能性があるが、
                        // 今回はAnimatePresenceで制御するため、ここには配置用コンテナとして記述
                        zIndex: 20,
                        pointerEvents: 'none', // パネル自体がポインターイベントを持つようにする
                    }}
                >
                    {inspector}
                </aside>
            </main>
        </div>
    );
};

export default AppLayout;
