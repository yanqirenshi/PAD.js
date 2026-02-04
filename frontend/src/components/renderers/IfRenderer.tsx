import * as d3 from 'd3';
import { IfBlockGeometry } from './IfBlockGeometry';
import type { LayoutNode } from '../../utils/layout';

/**
 * D3.jsでIF条件ブロック（くさび形）を描画します
 * @param parent 親のD3セレクション (SVGGElement)
 * @param layout レイアウトノード
 * @param renderChildFn 子ノードを再帰描画するための関数
 */
export function renderIfBlock(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    layout: LayoutNode,
    renderChildFn: (parent: d3.Selection<SVGGElement, unknown, null, undefined>, layout: LayoutNode) => void
) {
    const { x, y, children, condition } = layout;

    const geometry = new IfBlockGeometry(layout);
    const tr = geometry.getTopRight();
    const br = geometry.getBottomRight();
    const notch = geometry.getNotch();
    const points = geometry.getPolygonPoints();

    const thenLayout = children[0];
    const elseLayout = children.length > 1 ? children[1] : null;

    const textX = notch.x / 2;
    const textY = notch.y;

    const g = parent.append('g').attr('transform', `translate(${x},${y})`);

    // 条件の形状 (ポリゴン)
    g.append('polygon')
        .attr('points', points)
        .attr('stroke', 'black')
        .attr('fill', '#fff')
        .attr('stroke-width', 1.5);

    // 条件テキスト
    g.append('text')
        .attr('x', textX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-family', 'monospace')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .text(condition || '?');

    // True分岐の接続線
    g.append('line')
        .attr('x1', tr.x).attr('y1', tr.y)
        .attr('x2', thenLayout.x).attr('y2', tr.y)
        .attr('stroke', 'black');

    g.append('text')
        .attr('x', tr.x - 5)
        .attr('y', tr.y - 5)
        .attr('text-anchor', 'end')
        .attr('font-size', 12)
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text('T');

    // Then子ノード描画
    renderChildFn(g, thenLayout);

    // False分岐（存在する場合）
    if (elseLayout) {
        g.append('line')
            .attr('x1', br.x).attr('y1', br.y)
            .attr('x2', elseLayout.x).attr('y2', br.y)
            .attr('stroke', 'black');

        g.append('text')
            .attr('x', br.x - 5)
            .attr('y', br.y - 5)
            .attr('text-anchor', 'end')
            .attr('font-size', 12)
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .text('F');

        renderChildFn(g, elseLayout);
    }

    return g;
}
