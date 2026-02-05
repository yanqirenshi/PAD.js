import type { LayoutNode } from '../../utils/layout';
import type { Point } from './Point';

/**
 * IFブロックの形状計算を行うクラス
 * 描画に必要な各頂点の座標を計算・管理する
 */
export class IfBlockGeometry {
    private readonly layout: LayoutNode;
    private readonly config = {
        gap: 20,
        notch: 15,
        minWedgeHeight: 60
    };

    constructor(layout: LayoutNode) {
        this.layout = layout;
    }

    /**
     * 左上の頂点座標を取得
     * くさび形の上辺の左端 (Thenブロックの中央高さと一致)
     */
    getTopLeft(): Point {
        const thenLayout = this.layout.children[0];
        const y = thenLayout.height / 2;
        return { x: 0, y };
    }

    /**
     * 右上の頂点座標を取得
     * くさび形の上辺の右端
     */
    getTopRight(): Point {
        const thenLayout = this.layout.children[0];
        const x = thenLayout.x - this.config.gap;
        const y = thenLayout.height / 2;
        return { x, y };
    }

    /**
     * 右下の頂点座標を取得
     * くさび形の下辺の右端
     */
    getBottomRight(): Point {
        const thenLayout = this.layout.children[0];
        const elseLayout = this.layout.children.length > 1 ? this.layout.children[1] : null;

        const topVertexY = thenLayout.height / 2;
        const x = thenLayout.x - this.config.gap;

        let y;
        if (elseLayout) {
            y = elseLayout.y + elseLayout.height / 2;
        } else {
            y = Math.max(topVertexY + this.config.minWedgeHeight, this.layout.height - 20);
        }

        return { x, y };
    }

    /**
     * 左下の頂点座標を取得
     * くさび形の下辺の左端
     */
    getBottomLeft(): Point {
        const bottomRight = this.getBottomRight();
        return { x: 0, y: bottomRight.y };
    }

    /**
     * 右辺の窪み（ノッチ）の座標を取得
     * 右上頂点と右下頂点の垂直方向の中央
     */
    getNotch(): Point {
        const topRight = this.getTopRight();
        const bottomRight = this.getBottomRight();

        const x = topRight.x - this.config.notch;
        const y = (topRight.y + bottomRight.y) / 2;

        return { x, y };
    }

    /**
     * ポリゴンのpoints属性用の文字列を生成
     * 順序: 左上 -> 右上 -> ノッチ -> 右下 -> 左下
     */
    getPolygonPoints(): string {
        const tl = this.getTopLeft();
        const tr = this.getTopRight();
        const notch = this.getNotch();
        const br = this.getBottomRight();
        const bl = this.getBottomLeft();

        return `${tl.x},${tl.y} ${tr.x},${tr.y} ${notch.x},${notch.y} ${br.x},${br.y} ${bl.x},${bl.y}`;
    }
}
