import * as d3 from 'd3';
import { FunctionContainerGeometry } from './FunctionContainerGeometry';

/**
 * D3.jsで関数コンテナ（ヘッダー＋ボディ）を描画します
 * @param parent 親のD3セレクション (SVGGElement)
 * @param x X座標
 * @param y Y座標
 * @param width コンテナ幅
 * @param height コンテナ高さ
 * @param label 関数名ラベル
 * @returns 内部コンテンツを描画するためのグループセレクション
 */
export function renderFunctionContainer(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string
): d3.Selection<SVGGElement, unknown, null, undefined> {
    const geometry = new FunctionContainerGeometry(0, 0, width, height);
    const headerRect = geometry.getHeaderRect();
    const bodyRect = geometry.getBodyRect();
    const titlePos = geometry.getTitlePosition();

    const g = parent.append('g').attr('transform', `translate(${x},${y})`);

    // ヘッダー背景
    g.append('rect')
        .attr('x', headerRect.x)
        .attr('y', headerRect.y)
        .attr('width', headerRect.width)
        .attr('height', headerRect.height)
        .attr('fill', '#f0f0f0')
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // ボディ背景/境界線
    g.append('rect')
        .attr('x', bodyRect.x)
        .attr('y', bodyRect.y)
        .attr('width', bodyRect.width)
        .attr('height', bodyRect.height)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // タイトルテキスト
    g.append('text')
        .attr('x', titlePos.x)
        .attr('y', titlePos.y)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .text(label);

    // 内部コンテンツ用グループを返す
    return g;
}
