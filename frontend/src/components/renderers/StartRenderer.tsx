import React from 'react';
import type { StartRendererProps } from './StartRendererProps';
import { StartBlockGeometry } from './StartBlockGeometry';

export const StartRenderer: React.FC<StartRendererProps> = ({ x, y, label = "Start" }) => {
    const calculatedWidth = StartBlockGeometry.calculateWidth(label);
    const geometry = new StartBlockGeometry(x, y, calculatedWidth);
    const width = geometry.getWidth();
    const height = geometry.getHeight();
    const rx = height / 2; // 丸み（高さの半分で完全な楕円/カプセル型に）

    return (
        <g>
            <rect
                x={geometry.getX()}
                y={geometry.getY()}
                width={width}
                height={height}
                rx={rx}
                ry={rx}
                stroke="black"
                fill="white"
                strokeWidth="1.5"
            />
            <text
                x={geometry.getX() + width / 2}
                y={geometry.getY() + height / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily="monospace"
                fontSize={14}
                fontWeight="bold"
            >
                {label}
            </text>
        </g>
    );
};
