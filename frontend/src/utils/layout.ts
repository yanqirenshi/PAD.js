import type { PadNode } from '../types';

export interface LayoutNode {
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
    LOOP_CONDITION_WIDTH: 30,
};

export function calculateLayout(node: PadNode): LayoutNode {
    switch (node.type) {
        case 'sequence':
            return layoutSequence(node.children);
        case 'block':
            return layoutBlock(node.label, node.children);
        case 'command':
            return layoutCommand(node.label);
        case 'if':
            const ifChildren = [node.then_block];
            if (node.else_block) ifChildren.push(node.else_block);
            return layoutIf(node.condition, ifChildren);
        case 'loop':
            return layoutLoop(node.condition, node.body);
        default:
            // Fallback for error/unknown
            return {
                padNode: node, x: 0, y: 0, width: CONFIG.MIN_WIDTH, height: CONFIG.MIN_HEIGHT, children: []
            };
    }
}

function layoutSequence(nodes: PadNode[]): LayoutNode {
    const childrenLayouts = nodes.map(calculateLayout);

    let currentY = 0;
    let maxWidth = CONFIG.MIN_WIDTH;

    childrenLayouts.forEach(child => {
        child.y = currentY;
        currentY += child.height;
        maxWidth = Math.max(maxWidth, child.width);
    });

    // Stretch children to max width
    childrenLayouts.forEach(() => {
        // recursively stretch? For now, just set width of top level
        // Ideally, we should propagate stretch down, but let's keep it simple.
        // D3 renderer can draw full width based on parent.
        // child.width = maxWidth; 
    });

    return {
        padNode: { type: 'sequence', children: nodes },
        x: 0,
        y: 0,
        width: maxWidth,
        height: currentY,
        children: childrenLayouts
    };
}

import { StartBlockGeometry } from '../components/renderers/StartBlockGeometry';

function layoutBlock(label: string, children: PadNode[]): LayoutNode {
    const seqLayout = layoutSequence(children);

    // START/ENDブロックの設定
    // Renderer uses "START", so we must use "START" here for consistent alignment
    const startNodeWidth = StartBlockGeometry.calculateWidth("START");
    const startNodeHeight = 30;
    const endNodeHeight = 30;

    // STARTブロックは (0, 0) に配置 (幅60)
    // 垂直線のX座標は 30
    const centerLineX = startNodeWidth / 2;

    // シーケンスを配置
    // シーケンスの左端を垂直線のX座標に合わせる
    seqLayout.x = centerLineX;

    // 上部のパディング (STARTブロック + 垂直線の余白)
    const paddingTop = startNodeHeight + 20;
    seqLayout.y = paddingTop;

    // 下部のパディング (ENDブロックへの余白)
    const paddingBottom = 20;

    // 全体の高さ
    // START(30) + Gap(20) + SeqHeight + Gap(20) + END(30)
    const totalHeight = paddingTop + seqLayout.height + paddingBottom + endNodeHeight;

    return {
        padNode: { type: 'block', label, children },
        x: 0,
        y: 0,
        width: Math.max(seqLayout.width + centerLineX, startNodeWidth),
        height: totalHeight,
        children: [seqLayout],
        label
    }
}

function layoutCommand(label: string): LayoutNode {
    const textWidth = label.length * CONFIG.CHAR_WIDTH + 20;
    const width = Math.max(CONFIG.MIN_WIDTH, textWidth);
    return {
        padNode: { type: 'command', label },
        x: 0,
        y: 0,
        width: width,
        height: CONFIG.MIN_HEIGHT,
        children: [],
        label
    };
}

function layoutIf(condition: string, children: PadNode[]): LayoutNode {
    const thenLayout = calculateLayout(children[0]); // children[0] is 'then' block
    const elseLayout = children.length > 1 ? calculateLayout(children[1]) : null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = '14px monospace';
    // Ensure the condition box is wide enough for the text + padding
    const labelWidth = Math.max(context.measureText(condition).width, 40) + 60;

    // x-offset for children (Wedge width)
    const childX = labelWidth;

    // --- 垂直配置のロジック ---
    // 1. Then ブロック (上)
    thenLayout.y = 0;
    thenLayout.x = childX;

    const thenHalf = thenLayout.height / 2;
    const topVertexY = thenHalf;

    let height = 0;
    const gap = 40; // ブロック間の最小ギャップ
    // テキストを含み、見た目を良くするためにくさび形には最小の高さが必要
    const minWedgeHeight = 60;

    if (elseLayout) {
        const elseHalf = elseLayout.height / 2;

        // 上の頂点と下の頂点の間の距離は、少なくとも minWedgeHeight 必要
        // また、次の条件満たす必要がある: ElseTop >= ThenBottom + Gap
        // ElseCenter - ElseHalf >= ThenHeight + Gap
        // ElseCenter >= ThenHeight + Gap + ElseHalf

        // したがって、BotVertexY (ElseCenter) は以下のようになる:
        const minBotVertexY_for_spacing = thenLayout.height + gap + elseHalf;
        const minBotVertexY_for_wedge = topVertexY + minWedgeHeight;

        const botVertexY = Math.max(minBotVertexY_for_spacing, minBotVertexY_for_wedge);

        elseLayout.y = botVertexY - elseHalf;
        elseLayout.x = childX;

        height = elseLayout.y + elseLayout.height;
    } else {
        // Elseがない場合、下の頂点は最小くさび高さによって決まる
        height = Math.max(thenLayout.height, topVertexY + minWedgeHeight);
    }

    // 右側にパディングを追加
    const width = childX + Math.max(thenLayout.width, elseLayout ? elseLayout.width : 0) + 50;
    // 下側にパディングを追加
    const totalHeight = height + 20;

    return {
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

function layoutLoop(condition: string, body: PadNode): LayoutNode {
    const bodyLayout = calculateLayout(body);
    const condWidth = CONFIG.LOOP_CONDITION_WIDTH;

    // Body is to the right
    bodyLayout.x = condWidth;
    bodyLayout.y = 0;

    return {
        padNode: { type: 'loop', condition, body },
        x: 0,
        y: 0,
        width: condWidth + bodyLayout.width,
        height: bodyLayout.height, // Usually loop bar matches body height
        children: [bodyLayout],
        condition
    }
}
