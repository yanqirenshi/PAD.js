import React from 'react';
import type { EndRendererProps } from './EndRendererProps';
import { EndBlockGeometry } from './EndBlockGeometry';

export const EndRenderer: React.FC<EndRendererProps> = ({ x, y, label = "End" }) => {
    const geometry = new EndBlockGeometry(x, y);
    const width = geometry.getWidth();
    const height = geometry.getHeight();
    const rx = height / 2;

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
