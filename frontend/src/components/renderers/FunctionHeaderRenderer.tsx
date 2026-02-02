import React from 'react';
import type { FunctionHeaderProps } from './FunctionHeaderProps';
import { FunctionHeaderGeometry } from './FunctionHeaderGeometry';

export const FunctionHeaderRenderer: React.FC<FunctionHeaderProps> = ({ x, y, width, label }) => {
    const geometry = new FunctionHeaderGeometry(x, y, width);
    const textPos = geometry.getTextPosition();

    return (
        <g>
            {/* ヘッダー背景 (薄いグレー/青系) */}
            <rect
                x={geometry.getX()}
                y={geometry.getY()}
                width={geometry.getWidth()}
                height={geometry.getHeight()}
                fill="#e8edf2"
                stroke="black"
                strokeWidth="1" // 枠線は細めに
            />

            {/* 関数名テキスト */}
            <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="start"
                alignmentBaseline="middle"
                fontFamily="sans-serif" // ゴシック体っぽく
                fontSize={14}
                fontWeight="bold"
                fill="#000"
            >
                {label}
            </text>
        </g>
    );
};
