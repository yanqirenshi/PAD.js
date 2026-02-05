import * as d3 from 'd3';

/**
 * D3.jsでLoopの条件ボックスを描画します
 * @param parent 親のD3セレクション (SVGGElement)
 * @param x X座標
 * @param y Y座標
 * @param width ボックスの幅
 * @param height ボックスの高さ
 * @param condition 条件テキスト
 */
export function renderLoopCondition(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    width: number,
    height: number,
    condition: string
) {
    const stripeX = 10;

    const g = parent.append('g').attr('transform', `translate(${x},${y})`);

    // 条件ボックス
    g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('stroke', 'black')
        .attr('fill', 'white');

    // 左側の縦線（PADスタイル）
    g.append('line')
        .attr('x1', stripeX).attr('y1', 0)
        .attr('x2', stripeX).attr('y2', height)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // 条件テキスト
    g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'monospace')
        .attr('font-size', 14)
        .text(condition);

    return g;
}
