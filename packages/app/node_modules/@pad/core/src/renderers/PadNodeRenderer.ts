/**
 * @packageDocumentation
 * PADノードをD3.jsデータ結合パターンでレンダリングするモジュール
 */

import * as d3 from 'd3';
import type { LayoutNode } from '../utils/layout';
import { renderStart } from './blocks/StartRenderer';
import { renderEnd } from './blocks/EndRenderer';
import { renderLoopCondition } from './blocks/LoopRenderer';
import { renderIfBlock } from './blocks/IfRenderer';
import { StartBlockGeometry } from './blocks/StartBlockGeometry';
import { FunctionContainerGeometry } from './blocks/FunctionContainerGeometry';

/**
 * D3セレクションの型エイリアス
 */
type D3Selection = d3.Selection<SVGGElement, unknown, null, undefined>;

/**
 * LayoutNodeを持つD3セレクションの型エイリアス
 */
type D3SelectionWithLayout = d3.Selection<SVGGElement, LayoutNode, null, undefined>;

/**
 * PADノードをD3.jsデータ結合パターンでレンダリングするクラス
 * 
 * @remarks
 * このクラスは以下のD3.jsデータ結合パターンを実装しています:
 * - **Enter**: 新しいノードをDOMに追加
 * - **Update**: 既存ノードの位置やプロパティを更新
 * - **Exit**: 削除されたノードをDOMから除去
 * 
 * これにより、コードの変更時に最小限のDOM操作で効率的に再描画できます。
 * 
 * @example
 * ```typescript
 * const svg = d3.select('svg');
 * const rootG = svg.append('g');
 * const renderer = new PadNodeRenderer(rootG);
 * 
 * // 初回レンダリング
 * renderer.render([layout]);
 * 
 * // 更新時（変更があった部分のみ再描画）
 * renderer.render([updatedLayout]);
 * ```
 */
export class PadNodeRenderer {
    /** ルートSVGグループ要素 */
    private rootG: D3Selection;

    /** ノードごとのユーザードラッグオフセット（id -> {x, y}） */
    private nodeOffsets: Map<string, { x: number; y: number }> = new Map();

    /** 現在ドラッグ中のノードID（ドラッグ中はトランジションを無効化） */
    private draggingNodeId: string | null = null;

    /** ドラッグ開始時に呼ばれるコールバック（SVGズームを無効化するため） */
    public onDragStart?: () => void;

    /** ドラッグ終了時に呼ばれるコールバック（SVGズームを再有効化するため） */
    public onDragEnd?: () => void;

    /**
     * PadNodeRendererのコンストラクタ
     * @param rootG - ルートとなるSVGグループ要素のD3セレクション
     */
    constructor(rootG: D3Selection) {
        this.rootG = rootG;
    }

    /**
     * レイアウトノードの配列をレンダリング
     * 
     * @remarks
     * D3のデータ結合パターンを使用して、効率的にSVG要素を追加・更新・削除します。
     * 
     * @param layouts - レンダリングするレイアウトノードの配列
     */
    public render(layouts: LayoutNode[]): void {
        this.renderWithDataJoin(this.rootG, layouts);
    }

    /**
     * D3データ結合パターンによる再帰的レンダリング
     * 
     * @remarks
     * 各ノードタイプ（sequence, block, command, if, loop）に応じて
     * 適切なレンダリング処理を行います。
     * 
     * @param parent - 親SVGグループ要素
     * @param layouts - レンダリングするレイアウトノードの配列
     */
    private renderWithDataJoin(parent: D3Selection, layouts: LayoutNode[]): void {
        // データ結合: IDをキーとして使用
        const nodes = parent
            .selectAll<SVGGElement, LayoutNode>(':scope > g.pad-node')
            .data(layouts, d => d.id);

        // EXIT: 削除されたノード（フェードアウトアニメーション）
        nodes.exit()
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();

        // ENTER: 新規ノード（初期状態は透明）
        const enterNodes = nodes.enter()
            .append('g')
            .attr('class', 'pad-node')
            .style('opacity', 0);

        // ENTER + UPDATE: マージして更新
        const allNodes = enterNodes.merge(nodes);

        // 各ノードを処理
        allNodes.each((d, i, nodeElements) => {
            const g = d3.select(nodeElements[i]);

            // ユーザードラッグオフセットを取得（関数ブロックのみ）
            const offset = this.nodeOffsets.get(d.id) || { x: 0, y: 0 };
            const finalX = d.x + offset.x;
            const finalY = d.y + offset.y;

            // ドラッグ中のノードはトランジションをスキップ（競合防止）
            if (this.draggingNodeId === d.id) {
                // ドラッグ中は直接位置設定（ドラッグハンドラが管理）
                g.style('opacity', 1);
            } else {
                // 位置を更新（アニメーション付き）
                g.transition()
                    .duration(200)
                    .attr('transform', `translate(${finalX},${finalY})`)
                    .style('opacity', 1);
            }

            // ノードタイプに応じてコンテンツを更新
            this.updateNodeContent(g as D3SelectionWithLayout, d);
        });
    }

    /**
     * ノードコンテンツの更新（enter/update共通）
     * 
     * @remarks
     * ノードタイプに応じて適切な更新メソッドを呼び出します。
     * 新規ノード（isNew=true）の場合はDOM要素を作成し、
     * 既存ノードの場合は属性のみを更新します。
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     */
    private updateNodeContent(g: D3SelectionWithLayout, layout: LayoutNode): void {
        const { padNode } = layout;

        // 既存の内部コンテンツを保持/更新するため、クラス名でチェック
        const existingContent = g.select('.node-content');
        const isNew = existingContent.empty();

        switch (padNode.type) {
            case 'sequence':
                this.updateSequence(g, layout, isNew);
                break;
            case 'block':
                this.updateBlock(g, layout, isNew);
                break;
            case 'command':
                this.updateCommand(g, layout, isNew);
                break;
            case 'if':
                this.updateIf(g, layout, isNew);
                break;
            case 'loop':
                this.updateLoop(g, layout, isNew);
                break;
            default:
                break;
        }
    }

    /**
     * Sequenceノードの更新
     * 
     * @remarks
     * 子ノードを順番に配置するコンテナを描画します。
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     * @param isNew - 新規ノードかどうか
     */
    private updateSequence(g: D3SelectionWithLayout, layout: LayoutNode, isNew: boolean): void {
        if (isNew) {
            g.append('g').attr('class', 'node-content sequence-content');
        }

        const contentG = g.select<SVGGElement>('.node-content') as D3Selection;
        this.renderWithDataJoin(contentG, layout.children);
    }

    /**
     * Block（関数）ノードの更新
     * 
     * @remarks
     * 関数コンテナを描画します。以下の要素を含みます:
     * - ヘッダー（関数名）
     * - STARTノード
     * - 子ノード（関数本体）
     * - ENDノード
     * - 垂直接続線
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     * @param isNew - 新規ノードかどうか
     */
    private updateBlock(g: D3SelectionWithLayout, layout: LayoutNode, isNew: boolean): void {
        const { width, height, children, label } = layout;

        const containerW = width;
        const containerH = height;
        const containerPadding = FunctionContainerGeometry.PADDING;
        const headerHeight = FunctionContainerGeometry.HEADER_HEIGHT;

        if (isNew) {
            // 新規作成: Function Container
            const contentG = g.append('g').attr('class', 'node-content block-content');

            // コンテナ背景
            contentG.append('rect')
                .attr('class', 'container-bg')
                .attr('rx', 5);

            // ヘッダー背景
            contentG.append('rect')
                .attr('class', 'header-bg')
                .attr('rx', 5);

            // ヘッダーテキスト
            contentG.append('text')
                .attr('class', 'header-text')
                .attr('font-family', 'monospace')
                .attr('font-size', 14)
                .attr('font-weight', 'bold');

            // START ノード
            contentG.append('g').attr('class', 'start-node');

            // 垂直線
            contentG.append('line').attr('class', 'vertical-line');

            // 子ノード用グループ
            contentG.append('g').attr('class', 'children-container');

            // END ノード
            contentG.append('g').attr('class', 'end-node');
        }

        const contentG = g.select<SVGGElement>('.node-content');

        // コンテナ背景を更新
        contentG.select('.container-bg')
            .attr('x', 0).attr('y', 0)
            .attr('width', containerW)
            .attr('height', containerH)
            .attr('stroke', '#333')
            .attr('fill', '#f9f9f9');

        // ヘッダー背景を更新（ドラッグ可能）
        const headerBg = contentG.select<SVGRectElement>('.header-bg')
            .attr('x', 0).attr('y', 0)
            .attr('width', containerW)
            .attr('height', headerHeight)
            .attr('fill', '#e0e0e0')
            .style('cursor', 'grab');

        // ドラッグ動作を設定
        const nodeId = layout.id;
        // 現在のオフセットを累積
        let currentOffsetX = 0;
        let currentOffsetY = 0;

        const drag = d3.drag<SVGRectElement, unknown>()
            .on('start', () => {
                // 現在のオフセットを取得
                const currentOffset = this.nodeOffsets.get(nodeId) || { x: 0, y: 0 };
                currentOffsetX = currentOffset.x;
                currentOffsetY = currentOffset.y;

                // ドラッグ中フラグを設定
                this.draggingNodeId = nodeId;

                // ドラッグ開始時にコールバック呼び出し
                this.onDragStart?.();
                headerBg.style('cursor', 'grabbing');
            })
            .on('drag', (event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) => {
                // マウスの生の移動量を取得
                const sourceEvent = event.sourceEvent as MouseEvent;
                const movementX = sourceEvent.movementX;
                const movementY = sourceEvent.movementY;

                // 現在のズームスケールを取得（SVGのtransformから）
                const svg = g.node()?.ownerSVGElement;
                let scale = 1;
                if (svg) {
                    const rootG = svg.querySelector('g');
                    if (rootG) {
                        const transform = rootG.getAttribute('transform');
                        if (transform) {
                            // scale(N) を抽出
                            const scaleMatch = transform.match(/scale\(([^)]+)\)/);
                            if (scaleMatch) {
                                scale = parseFloat(scaleMatch[1]);
                            }
                        }
                    }
                }

                // ズームスケールで補正（ズームしている場合、移動量を逆スケール）
                currentOffsetX += movementX / scale;
                currentOffsetY += movementY / scale;

                // オフセットを保存
                const newOffset = { x: currentOffsetX, y: currentOffsetY };
                this.nodeOffsets.set(nodeId, newOffset);

                // 即座に位置を更新（レイアウトの基本位置 + ユーザーオフセット）
                g.attr('transform', `translate(${layout.x + newOffset.x},${layout.y + newOffset.y})`);
            })
            .on('end', () => {
                // ドラッグ中フラグをクリア
                this.draggingNodeId = null;

                // ドラッグ終了時にコールバック呼び出し
                this.onDragEnd?.();
                headerBg.style('cursor', 'grab');
            });

        // ドラッグ動作をヘッダーに適用
        headerBg.call(drag as any);

        // ヘッダーテキストを更新
        contentG.select('.header-text')
            .attr('x', 10)
            .attr('y', headerHeight / 2 + 5)
            .attr('pointer-events', 'none')  // テキストはクリック不可（ドラッグの邪魔にならないように）
            .text(label || 'Unknown Function');

        // START ノード
        const startLabel = 'START';
        const startX = containerPadding;
        const startY = headerHeight + containerPadding;
        const startW = StartBlockGeometry.calculateWidth(startLabel);
        const startH = 30;

        const startG = contentG.select<SVGGElement>('.start-node');
        if (startG.select('rect').empty()) {
            renderStart(startG as any, startX, startY, startLabel);
        }

        // 垂直線を更新
        const centerX = startW / 2;
        const endH = 30;
        const endY = containerH - containerPadding - endH;

        contentG.select('.vertical-line')
            .attr('x1', startX + centerX)
            .attr('y1', startY + startH)
            .attr('x2', startX + centerX)
            .attr('y2', endY)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5);

        // 子ノードを更新
        const childrenG = contentG.select<SVGGElement>('.children-container') as D3Selection;
        this.renderWithDataJoin(childrenG, children);

        // END ノード
        const endW = 60;
        const endX = startX + centerX - (endW / 2);
        const endG = contentG.select<SVGGElement>('.end-node');
        if (endG.select('rect').empty()) {
            renderEnd(endG as any, endX, endY, 'END');
        }
    }

    /**
     * Commandノードの更新
     * 
     * @remarks
     * 単一の処理ステップを表す矩形ブロックを描画します。
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     * @param isNew - 新規ノードかどうか
     */
    private updateCommand(g: D3SelectionWithLayout, layout: LayoutNode, isNew: boolean): void {
        const { width, height, label } = layout;

        if (isNew) {
            const contentG = g.append('g').attr('class', 'node-content command-content');
            contentG.append('rect').attr('class', 'command-rect');
            contentG.append('text').attr('class', 'command-text');
        }

        const contentG = g.select<SVGGElement>('.node-content');

        // 矩形を更新
        contentG.select('.command-rect')
            .attr('x', 0).attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('stroke', 'black')
            .attr('fill', 'white');

        // テキストを更新
        contentG.select('.command-text')
            .attr('x', 5)
            .attr('y', 25)
            .attr('font-family', 'monospace')
            .attr('font-size', 14)
            .text(label || '');
    }

    /**
     * Ifノードの更新
     * 
     * @remarks
     * 条件分岐（If-Then-Else）を表すくさび形ブロックを描画します。
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     * @param isNew - 新規ノードかどうか
     */
    private updateIf(g: D3SelectionWithLayout, layout: LayoutNode, isNew: boolean): void {
        // IF ブロックは既存のrenderIfBlockを使用（複雑なため）
        if (isNew) {
            const contentG = g.append('g').attr('class', 'node-content if-content');
            renderIfBlock(contentG as any, layout, (parent, childLayout) => {
                this.renderWithDataJoin(parent as D3Selection, [childLayout]);
            });
        } else {
            // 更新: 子ノードのみ更新
            const contentG = g.select<SVGGElement>('.node-content');
            layout.children.forEach((child, index) => {
                const childContainer = contentG.select<SVGGElement>(`.if-child-${index}`);
                if (!childContainer.empty()) {
                    this.renderWithDataJoin(childContainer as D3Selection, [child]);
                }
            });
        }
    }

    /**
     * Loopノードの更新
     * 
     * @remarks
     * 繰り返し処理（while/for）を表す二重線ボックスを描画します。
     * 
     * @param g - ノードのD3セレクション
     * @param layout - レイアウト情報
     * @param isNew - 新規ノードかどうか
     */
    private updateLoop(g: D3SelectionWithLayout, layout: LayoutNode, isNew: boolean): void {
        const { children, condition } = layout;
        const bodyLayout = children[0];
        const gap = 20;
        const boxWidth = bodyLayout.x - gap;
        const boxHeight = 40;

        if (isNew) {
            const contentG = g.append('g').attr('class', 'node-content loop-content');

            // 条件ボックス
            contentG.append('g').attr('class', 'condition-box');

            // 水平接続線
            contentG.append('line').attr('class', 'h-line');

            // 垂直線
            contentG.append('line').attr('class', 'v-line');

            // ボディ用グループ
            contentG.append('g').attr('class', 'loop-body');
        }

        const contentG = g.select<SVGGElement>('.node-content');

        // 条件ボックスを更新
        const condBoxG = contentG.select<SVGGElement>('.condition-box');
        if (condBoxG.select('rect').empty()) {
            renderLoopCondition(condBoxG as any, 0, 0, boxWidth, boxHeight, condition || '');
        }

        // 水平接続線を更新
        contentG.select('.h-line')
            .attr('x1', boxWidth)
            .attr('y1', boxHeight / 2)
            .attr('x2', bodyLayout.x)
            .attr('y2', boxHeight / 2)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5);

        // 垂直線を更新
        contentG.select('.v-line')
            .attr('x1', bodyLayout.x)
            .attr('y1', 0)
            .attr('x2', bodyLayout.x)
            .attr('y2', bodyLayout.height)
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5);

        // ボディを更新
        const bodyG = contentG.select<SVGGElement>('.loop-body') as D3Selection;
        this.renderWithDataJoin(bodyG, [bodyLayout]);
    }
}
