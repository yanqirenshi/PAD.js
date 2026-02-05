import type { Point } from './Point';

/**
 * STARTブロックの形状計算を行うクラス
 */
export class StartBlockGeometry {
    private readonly x: number;
    private readonly y: number;
    private readonly width: number;
    private readonly height: number = 30;

    constructor(x: number, y: number, width: number = 60) {
        this.x = x;
        this.y = y;
        this.width = width;
    }

    static calculateWidth(label: string): number {
        // 簡易的な文字幅計算 (1文字9px + パディング40px)
        // 最低幅 60px
        return Math.max(60, label.length * 9 + 40);
    }

    /**
     * 上辺の中央座標を取得
     */
    getTopCenter(): Point {
        return { x: this.x + this.width / 2, y: this.y };
    }

    /**
     * 下辺の中央座標を取得
     * ここから垂直線が伸びる
     */
    getBottomCenter(): Point {
        return { x: this.x + this.width / 2, y: this.y + this.height };
    }

    /**
     * ブロックの幅を取得
     */
    getWidth(): number {
        return this.width;
    }

    /**
     * ブロックの高さを取得
     */
    getHeight(): number {
        return this.height;
    }

    /**
     * 描画開始位置(左上)のX座標
     */
    getX(): number {
        return this.x;
    }

    /**
     * 描画開始位置(左上)のY座標
     */
    getY(): number {
        return this.y;
    }
}
