import React, { useMemo } from 'react';
import type { PadNode } from '../types';
import { calculateLayout, type LayoutNode } from '../utils/layout';
import { IfRenderer } from './renderers/IfRenderer';
import { StartRenderer } from './renderers/StartRenderer';
import { EndRenderer } from './renderers/EndRenderer';
import { FunctionHeaderRenderer } from './renderers/FunctionHeaderRenderer';
import { StartBlockGeometry } from './renderers/StartBlockGeometry';

interface D3PadRendererProps {
    node: PadNode;
}

export const D3PadRenderer: React.FC<D3PadRendererProps> = ({ node }) => {
    const layout = useMemo(() => calculateLayout(node), [node]);

    return (
        <div style={{ overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            <svg width={layout.width + 20} height={Math.max(666, layout.height + 50)}>
                <g transform="translate(10,10)">
                    <RenderNode layout={layout} />
                </g>
            </svg>
        </div>
    );
};

const RenderNode: React.FC<{ layout: LayoutNode }> = ({ layout }) => {
    const { padNode, x, y, width, height, children, label, condition } = layout;

    switch (padNode.type) {
        case 'sequence':
            // Sequence just renders children offset by their Y
            return (
                <g transform={`translate(${x},${y})`}>
                    {children.map((child, i) => (
                        <RenderNode key={i} layout={child} />
                    ))}
                </g>
            );

        case 'block':
            // START/END Block Layout
            // layout.ts:
            // children[0] (seq) is at x = 30 (centerLineX), y = 50 (start + gap)
            // Start Node at (0, 0)

            const startX = 0;
            const startY = 0;
            // Use "START" as requested
            const startLabel = "START";
            const startW = StartBlockGeometry.calculateWidth(startLabel);
            const startH = 30;

            // End Node at bottom
            const endH = 30;
            // EndBlockGeometry has fixed width 60
            const endW = 60;

            const centerX = startW / 2;
            // Align End block center to the vertical line (centerX)
            const endX = centerX - (endW / 2);

            // Total Height calculation in layout.ts matches this structure
            // We can infer Y position from layout height or re-calculate
            const endY = height - endH;

            return (
                <g transform={`translate(${x},${y})`}>
                    <StartRenderer x={startX} y={startY} label={startLabel} />

                    {/* Vertical Line connecting Start Bottom-Center to End Top-Center */}
                    <line
                        x1={centerX}
                        y1={startY + startH}
                        x2={centerX}
                        y2={endY}
                        stroke="black"
                        strokeWidth="1.5"
                    />

                    {/* Render Children (Sequence) */}
                    {children.map((child, i) => (
                        <g key={i} transform={`translate(0, 0)`}>
                            <RenderNode layout={child} />
                        </g>
                    ))}

                    <EndRenderer x={endX} y={endY} />
                </g>
            );

        case 'command':
            return (
                <g transform={`translate(${x},${y})`}>
                    <rect x={0} y={0} width={width} height={height} stroke="black" fill="white" />
                    <text x={5} y={25} fontFamily="monospace" fontSize={14}>{label}</text>
                </g>
            );

        case 'if':
            return (
                <IfRenderer
                    layout={layout}
                    renderChild={(child) => <RenderNode layout={child} />}
                />
            );
        case 'loop':
            const bodyLayout = children[0];
            const barWidth = 30;
            return (
                <g transform={`translate(${x},${y})`}>
                    {/* Condition Bar */}
                    <rect x={0} y={0} width={barWidth} height={height} stroke="black" fill="#f0f0f0" />
                    <text
                        x={15} y={height / 2}
                        textAnchor="middle"
                        transform={`rotate(-90, 15, ${height / 2})`}
                        fontFamily="monospace" fontSize={12}
                    >
                        {condition}
                    </text>

                    {/* Body */}
                    <g transform={`translate(${barWidth}, 0)`}>
                        <RenderNode layout={bodyLayout} />
                    </g>
                </g>
            )

        default:
            return null;
    }
};
