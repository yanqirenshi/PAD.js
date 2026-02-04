/**
 * @packageDocumentation
 * PAD図をD3.jsで描画するReactコンポーネント
 */

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { PadNode } from '../types';
import { calculateLayout } from '../utils/layout';
import { PadNodeRenderer } from './PadNodeRenderer';

/**
 * D3PadRendererコンポーネントのプロパティ
 */
export interface D3PadRendererProps {
    /**
     * 描画するPADノードのルート
     */
    node: PadNode;
}

/**
 * PAD（Problem Analysis Diagram）をD3.jsで描画するReactコンポーネント
 * 
 * @remarks
 * このコンポーネントは以下の機能を提供します:
 * - PadNodeからLayoutNodeへのレイアウト計算
 * - D3.jsによるSVG描画
 * - データ結合パターン（enter/update/exit）による効率的な再描画
 * 
 * @example
 * ```tsx
 * const padNode: PadNode = { type: 'block', label: 'main', children: [] };
 * <D3PadRenderer node={padNode} />
 * ```
 * 
 * @param props - コンポーネントのプロパティ
 * @returns PAD図を描画するSVG要素を含むdiv
 */
export const D3PadRenderer: React.FC<D3PadRendererProps> = ({ node }) => {
    /** SVG要素への参照 */
    const svgRef = useRef<SVGSVGElement>(null);

    /** PadNodeRendererインスタンスへの参照 */
    const rendererRef = useRef<PadNodeRenderer | null>(null);

    /** ズーム動作への参照 */
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    /** ルートグループへの参照 */
    const rootGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    /** 計算されたレイアウト（nodeが変更された時のみ再計算） */
    const layout = useMemo(() => calculateLayout(node), [node]);

    /**
     * URLクエリパラメータから初期のtransformを取得
     */
    const getInitialTransform = () => {
        const params = new URLSearchParams(window.location.search);
        const x = parseFloat(params.get('x') ?? '10');
        const y = parseFloat(params.get('y') ?? '10');
        const zoom = parseFloat(params.get('zoom') ?? '1');
        return d3.zoomIdentity.translate(x, y).scale(zoom);
    };

    /**
     * URLクエリパラメータを更新
     */
    const updateUrlParams = (transform: d3.ZoomTransform) => {
        const params = new URLSearchParams(window.location.search);
        params.set('x', transform.x.toFixed(2));
        params.set('y', transform.y.toFixed(2));
        params.set('zoom', transform.k.toFixed(2));
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    };

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);

        // SVGサイズを更新（ウィンドウ全体）
        svg.attr('width', '100%')
            .attr('height', '100%');

        // ズーム動作を初期化（最初の1回のみ）
        if (!zoomRef.current) {
            // ルートグループを作成
            rootGRef.current = svg.append('g').attr('transform', 'translate(10,10)');

            // レンダラーを初期化
            rendererRef.current = new PadNodeRenderer(rootGRef.current);

            // ズーム動作を設定（パンとズーム）
            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 4]) // 0.1倍〜4倍までズーム可能
                .on('zoom', (event) => {
                    if (rootGRef.current) {
                        rootGRef.current.attr('transform', event.transform.toString());
                        // URLパラメータを更新
                        updateUrlParams(event.transform);
                    }
                });

            // SVGにズーム動作を適用
            svg.call(zoomRef.current);

            // URLパラメータから初期位置を設定
            const initialTransform = getInitialTransform();
            svg.call(zoomRef.current.transform, initialTransform);
        }

        // データ結合パターンでレンダリング
        rendererRef.current?.render([layout]);

    }, [layout]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'auto',
            zIndex: 0
        }}>
            <svg ref={svgRef} style={{ minWidth: '100%', minHeight: '100%' }}></svg>
        </div>
    );
};
