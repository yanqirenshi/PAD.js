import * as d3 from 'd3';
import { FunctionHeaderGeometry } from './FunctionHeaderGeometry';

/**
 * D3.jsで関数ヘッダー（ラベル付きバー）を描画します
 * @param parent 親のD3セレクション (SVGGElement)
 * @param x X座標
 * @param y Y座標
 * @param width ヘッダー幅
 * @param label 関数名ラベル
 */
export function renderFunctionHeader(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    width: number,
    label: string
) {
    const geometry = new FunctionHeaderGeometry(x, y, width);
    const textPos = geometry.getTextPosition();

    const g = parent.append('g');

    // ヘッダー背景
    g.append('rect')
        .attr('x', geometry.getX())
        .attr('y', geometry.getY())
        .attr('width', geometry.getWidth())
        .attr('height', geometry.getHeight())
        .attr('fill', '#e8edf2')
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // 関数名テキスト
    g.append('text')
        .attr('x', textPos.x)
        .attr('y', textPos.y)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .text(label);

    return g;
}
