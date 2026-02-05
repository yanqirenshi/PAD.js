import type { Point } from './Point';

/**
 * 関数ヘッダー（関数名表示部）の形状計算を行うクラス
 */
export class FunctionHeaderGeometry {
    private readonly x: number;
    private readonly y: number;
    private readonly width: number;
    private readonly height: number = 30; // 固定高さ

    constructor(x: number, y: number, width: number) {
        this.x = x;
        this.y = y;
        this.width = width;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    /**
     * テキストの配置位置（左寄せ、パディングあり）を取得
     */
    getTextPosition(): Point {
        return {
            x: this.x + 10, // 左パディング
            y: this.y + this.height / 2
        };
    }
}
