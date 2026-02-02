import React from 'react';
import { IfBlockGeometry } from './IfBlockGeometry';
import type { IfRendererProps } from './IfRendererProps';

export const IfRenderer: React.FC<IfRendererProps> = ({ layout, renderChild }) => {
    const { x, y, children, condition } = layout;

    // 形状計算クラスのインスタンス化
    const geometry = new IfBlockGeometry(layout);

    // 各頂点の取得（描画に使用）
    const tr = geometry.getTopRight();
    const br = geometry.getBottomRight();
    // ノッチは条件テキストの配置に使用
    const notch = geometry.getNotch();
    // ポリゴン文字列
    const points = geometry.getPolygonPoints();

    // 子供のレイアウト
    const thenLayout = children[0];
    const elseLayout = children.length > 1 ? children[1] : null;

    // 条件テキストのX位置: (くさびの幅 - ノッチ深さ) / 2 ... の意図だが、
    // 正確には (0 + NotchX) / 2 あたりが重心に近い。
    // 以前のロジック: (w - notch) / 2 -> (tr.x - 15) / 2 ~= notch.x / 2
    const textX = notch.x / 2;
    const textY = notch.y;

    return (
        <g transform={`translate(${x},${y})`}>
            {/* 条件の形状 (ポリゴン) */}
            <polygon points={points} stroke="black" fill="#fff" strokeWidth="1.5" />

            {/* 条件テキスト */}
            <text
                x={textX} y={textY}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily="monospace" fontSize={14} fontWeight="bold"
            >
                {condition}
            </text>

            {/* True分岐の接続線 (右上頂点からThenブロックへ) */}
            <line x1={tr.x} y1={tr.y} x2={thenLayout.x} y2={tr.y} stroke="black" />
            <text x={tr.x - 5} y={tr.y - 5} textAnchor="end" fontSize={12} fontFamily="monospace" fontWeight="bold">T</text>

            <g transform={`translate(0, 0)`}>
                {renderChild(thenLayout)}
            </g>

            {/* False分岐の接続線 (右下頂点からElseブロックへ) */}
            {elseLayout && (
                <>
                    <line x1={br.x} y1={br.y} x2={elseLayout.x} y2={br.y} stroke="black" />
                    <text x={br.x - 5} y={br.y - 5} textAnchor="end" fontSize={12} fontFamily="monospace" fontWeight="bold">F</text>

                    <g transform={`translate(0, 0)`}>
                        {renderChild(elseLayout)}
                    </g>
                </>
            )}
        </g>
    );
};
