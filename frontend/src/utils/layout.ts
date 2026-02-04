import type { PadNode } from '../types';

export interface LayoutNode {
    id: string; // 一意のID（D3データ結合用）
    padNode: PadNode;
    x: number;
    y: number;
    width: number;
    height: number;
    children: LayoutNode[];
    // Extra data for drawing
    label?: string;
    condition?: string;
}

const CONFIG = {
    MIN_WIDTH: 100,
    MIN_HEIGHT: 40,
    BLOCK_PADDING: 10,
    FONT_SIZE: 14,
    CHAR_WIDTH: 8, // Approx
    IF_CONDITION_WIDTH: 30, // The small wedge/box on left
    MARGIN_Y: 20, // Vertical spacing between blocks
    GAP_X: 20, // Horizontal gap between condition and body
};

// ID生成用のカウンター
let idCounter = 0;

function generateId(prefix: string): string {
    return `${prefix}-${idCounter++}`;
}

// ID カウンターをリセット（新しいレイアウト計算開始時）
function resetIdCounter(): void {
    idCounter = 0;
}

export function calculateLayout(node: PadNode): LayoutNode {
    resetIdCounter();
    return calculateLayoutInternal(node, 'root');
}

function calculateLayoutInternal(node: PadNode, parentPath: string): LayoutNode {
    switch (node.type) {
        case 'sequence':
            return layoutSequence(node.children, parentPath);
        case 'block':
            return layoutBlock(node.label, node.children, parentPath);
        case 'command':
            return layoutCommand(node.label, parentPath);
        case 'if':
            const ifChildren = [node.then_block];
            if (node.else_block) ifChildren.push(node.else_block);
            return layoutIf(node.condition, ifChildren, parentPath);
        case 'loop':
            return layoutLoop(node.condition, node.body, parentPath);
        default:
            return {
                id: generateId(parentPath),
                padNode: node, x: 0, y: 0, width: CONFIG.MIN_WIDTH, height: CONFIG.MIN_HEIGHT, children: []
            };
    }
}

import { StartBlockGeometry } from '../components/renderers/StartBlockGeometry';
import { FunctionContainerGeometry } from '../components/renderers/FunctionContainerGeometry';

function layoutSequence(nodes: PadNode[], parentPath: string): LayoutNode {
    const id = generateId(`${parentPath}-seq`);
    const childrenLayouts = nodes.map((node, index) =>
        calculateLayoutInternal(node, `${id}-${index}`)
    );

    let currentY = 0;
    let maxWidth = CONFIG.MIN_WIDTH;

    childrenLayouts.forEach((child, index) => {
        child.y = currentY;
        currentY += child.height;

        if (index < childrenLayouts.length - 1) {
            currentY += CONFIG.MARGIN_Y;
        }

        maxWidth = Math.max(maxWidth, child.width);
    });

    return {
        id,
        padNode: { type: 'sequence', children: nodes },
        x: 0,
        y: 0,
        width: maxWidth,
        height: currentY,
        children: childrenLayouts
    };
}

function layoutBlock(label: string, children: PadNode[], parentPath: string): LayoutNode {
    const id = generateId(`${parentPath}-block`);
    const seqLayout = layoutSequence(children, id);

    const startNodeWidth = StartBlockGeometry.calculateWidth("START");
    const startNodeHeight = 30;
    const endNodeHeight = 30;

    const centerLineX = startNodeWidth / 2;
    const graphWidth = Math.max(seqLayout.width + centerLineX, startNodeWidth);

    const paddingTop = startNodeHeight + CONFIG.MARGIN_Y;
    const paddingBottom = CONFIG.MARGIN_Y;
    const graphHeight = paddingTop + seqLayout.height + paddingBottom + endNodeHeight;

    const containerPadding = FunctionContainerGeometry.PADDING;
    const headerHeight = FunctionContainerGeometry.HEADER_HEIGHT;

    const containerWidth = graphWidth + containerPadding * 2;
    const containerHeight = headerHeight + graphHeight + containerPadding * 2;

    seqLayout.x = containerPadding + centerLineX;

    const contentStartY = headerHeight + containerPadding;
    seqLayout.y = contentStartY + paddingTop;

    return {
        id,
        padNode: { type: 'block', label, children },
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
        children: [seqLayout],
        label
    }
}

function layoutCommand(label: string, parentPath: string): LayoutNode {
    const id = generateId(`${parentPath}-cmd`);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = '14px monospace';
    const textMetrics = context.measureText(label);

    const textWidth = textMetrics.width + 20;
    const width = Math.max(CONFIG.MIN_WIDTH, textWidth);

    return {
        id,
        padNode: { type: 'command', label },
        x: 0,
        y: 0,
        width: width,
        height: CONFIG.MIN_HEIGHT,
        children: [],
        label
    };
}

function layoutIf(condition: string, children: PadNode[], parentPath: string): LayoutNode {
    const id = generateId(`${parentPath}-if`);

    const thenLayout = calculateLayoutInternal(children[0], `${id}-then`);
    const elseLayout = children.length > 1 ? calculateLayoutInternal(children[1], `${id}-else`) : null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = '14px monospace';
    const labelWidth = Math.max(context.measureText(condition).width, 40) + 60;

    const childX = labelWidth;

    thenLayout.y = 0;
    thenLayout.x = childX;

    const thenHalf = thenLayout.height / 2;
    const topVertexY = thenHalf;

    let height = 0;
    const gap = 40;
    const minWedgeHeight = 60;

    if (elseLayout) {
        const elseHalf = elseLayout.height / 2;

        const minBotVertexY_for_spacing = thenLayout.height + gap + elseHalf;
        const minBotVertexY_for_wedge = topVertexY + minWedgeHeight;

        const botVertexY = Math.max(minBotVertexY_for_spacing, minBotVertexY_for_wedge);

        elseLayout.y = botVertexY - elseHalf;
        elseLayout.x = childX;

        height = elseLayout.y + elseLayout.height;
    } else {
        height = Math.max(thenLayout.height, topVertexY + minWedgeHeight);
    }

    const width = childX + Math.max(thenLayout.width, elseLayout ? elseLayout.width : 0) + 50;
    const totalHeight = height + 20;

    return {
        id,
        padNode: { type: 'if', condition, then_block: children[0], else_block: children.length > 1 ? children[1] : undefined },
        x: 0,
        y: 0,
        width,
        height: totalHeight,
        children: elseLayout ? [thenLayout, elseLayout] : [thenLayout],
        label: condition,
        condition
    }
}

function layoutLoop(condition: string, body: PadNode, parentPath: string): LayoutNode {
    const id = generateId(`${parentPath}-loop`);
    const bodyLayout = calculateLayoutInternal(body, `${id}-body`);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = '14px monospace';
    const textMetrics = context.measureText(condition);

    const doubleLineWidth = 10;
    const textPadding = 40;
    const conditionBoxWidth = doubleLineWidth + textMetrics.width + textPadding;

    const boxWidth = Math.max(CONFIG.MIN_WIDTH, conditionBoxWidth);

    bodyLayout.x = boxWidth + CONFIG.GAP_X;
    bodyLayout.y = 0;

    const width = boxWidth + CONFIG.GAP_X + bodyLayout.width;
    const height = Math.max(CONFIG.MIN_HEIGHT, bodyLayout.height);

    return {
        id,
        padNode: { type: 'loop', condition, body },
        x: 0,
        y: 0,
        width,
        height,
        children: [bodyLayout],
        condition
    }
}
