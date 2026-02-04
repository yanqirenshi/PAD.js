import * as d3 from 'd3';
import { StartBlockGeometry } from './StartBlockGeometry';

/**
 * D3.jsでStartブロック（楕円/カプセル型）を描画します
 * @param parent 親のD3セレクション (SVGGElement)
 * @param x X座標
 * @param y Y座標
 * @param label ラベルテキスト (デフォルト: "Start")
 */
export function renderStart(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    label: string = "Start"
) {
    const calculatedWidth = StartBlockGeometry.calculateWidth(label);
    const geometry = new StartBlockGeometry(x, y, calculatedWidth);
    const width = geometry.getWidth();
    const height = geometry.getHeight();
    const rx = height / 2;

    const g = parent.append('g');

    // 楕円/カプセル型の矩形
    g.append('rect')
        .attr('x', geometry.getX())
        .attr('y', geometry.getY())
        .attr('width', width)
        .attr('height', height)
        .attr('rx', rx)
        .attr('ry', rx)
        .attr('stroke', 'black')
        .attr('fill', 'white')
        .attr('stroke-width', 1.5);

    // ラベルテキスト
    g.append('text')
        .attr('x', geometry.getX() + width / 2)
        .attr('y', geometry.getY() + height / 2)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-family', 'monospace')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .text(label);

    return g;
}
