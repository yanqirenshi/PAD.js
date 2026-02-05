export type PadNode =
    | { type: 'sequence'; children: PadNode[] }
    | { type: 'block'; label: string; children: PadNode[] }
    | { type: 'if'; condition: string; then_block: PadNode; else_block?: PadNode }
    | { type: 'loop'; condition: string; body: PadNode }
    | { type: 'command'; label: string }
    | { type: 'error'; message: string };
