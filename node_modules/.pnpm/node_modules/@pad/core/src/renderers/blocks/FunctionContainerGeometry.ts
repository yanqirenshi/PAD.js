import type { Point } from './Point';

export class FunctionContainerGeometry {
    static readonly HEADER_HEIGHT = 30;
    static readonly PADDING = 20;

    private readonly x: number;
    private readonly y: number;
    private readonly width: number;
    private readonly height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getHeaderRect(): { x: number, y: number, width: number, height: number } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: FunctionContainerGeometry.HEADER_HEIGHT
        };
    }

    getBodyRect(): { x: number, y: number, width: number, height: number } {
        return {
            x: this.x,
            y: this.y + FunctionContainerGeometry.HEADER_HEIGHT,
            width: this.width,
            height: this.height - FunctionContainerGeometry.HEADER_HEIGHT
        };
    }

    getTitlePosition(): Point {
        return {
            x: this.x + 10, // Padding for text
            y: this.y + FunctionContainerGeometry.HEADER_HEIGHT / 2
        };
    }

    /**
     * Calculates the offset for the inner content (PAD graph).
     * This puts the content inside the body area, respecting padding.
     */
    getContentOffset(): Point {
        return {
            x: FunctionContainerGeometry.PADDING,
            y: FunctionContainerGeometry.HEADER_HEIGHT + FunctionContainerGeometry.PADDING
        };
    }
}
