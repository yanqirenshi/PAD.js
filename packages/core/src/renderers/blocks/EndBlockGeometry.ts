import type { Point } from './Point';

/**
 * ENDブロックの形状計算を行うクラス
 */
export class EndBlockGeometry {
    private readonly x: number;
    private readonly y: number;
    private readonly width: number = 60;
    private readonly height: number = 30;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * 上辺の中央座標を取得
     * ここへ垂直線が繋がる
     */
    getTopCenter(): Point {
        return { x: this.x + this.width / 2, y: this.y };
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
