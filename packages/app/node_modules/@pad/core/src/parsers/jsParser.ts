import * as acorn from 'acorn';
import type { PadNode } from '../types';

export function parse_js_code(code: string): string {
    const parser = new JsParser(code);
    return parser.parse();
}

class JsParser {
    private code: string;

    constructor(code: string) {
        this.code = code;
    }

    parse(): string {
        try {
            const ast = acorn.parse(this.code, { ecmaVersion: 2020 });
            const nodes: PadNode[] = [];

            // @ts-ignore
            for (const node of ast.body) {
                if (node.type === 'FunctionDeclaration') {
                    nodes.push(this.parseFunction(node));
                }
            }

            if (nodes.length === 0) {
                return JSON.stringify({ type: 'error', message: 'No function found' });
            }

            return JSON.stringify({ type: 'sequence', children: nodes });
        } catch (e) {
            return JSON.stringify({ type: 'error', message: `Parse error: ${e}` });
        }
    }

    private parseFunction(node: any): PadNode {
        const name = node.id?.name || 'anonymous';
        const body = this.parseBlock(node.body);
        return {
            type: 'block',
            label: `fn ${name}()`, // Use 'fn' label to match Rust style or just 'function'
            children: [body]
        };
    }

    private parseBlock(node: any): PadNode {
        const children: PadNode[] = [];
        if (node.body) {
            for (const stmt of node.body) {
                children.push(this.parseStmt(stmt));
            }
        }
        return { type: 'sequence', children };
    }

    private parseStmt(stmt: any): PadNode {
        switch (stmt.type) {
            case 'VariableDeclaration':
                return { type: 'command', label: this.snippet(stmt) };

            case 'ExpressionStatement':
                // Remove semicolon if present for cleaner display? 
                // Currently just taking snippet.
                return { type: 'command', label: this.snippet(stmt) };

            case 'IfStatement':
                return this.parseIf(stmt);

            case 'WhileStatement':
                return {
                    type: 'loop',
                    condition: this.snippet(stmt.test),
                    body: this.parseStmt(stmt.body)
                };

            case 'ForStatement':
                let condLabel = 'for (;;) ';
                if (stmt.init || stmt.test || stmt.update) {
                    const init = stmt.init ? this.snippet(stmt.init) : '';
                    const test = stmt.test ? this.snippet(stmt.test) : '';
                    const update = stmt.update ? this.snippet(stmt.update) : '';
                    // Clean up init if it has semicolon? 
                    // this.snippet(stmt.init) includes 'let i = 0', no semi usually if it's var decl node inside for
                    condLabel = `for (${init}; ${test}; ${update})`;
                }

                return {
                    type: 'loop',
                    condition: condLabel,
                    body: this.parseStmt(stmt.body)
                };

            case 'BlockStatement':
                return this.parseBlock(stmt);

            case 'ReturnStatement':
                return { type: 'command', label: this.snippet(stmt) };

            default:
                return { type: 'command', label: this.snippet(stmt) };
        }
    }

    private parseIf(stmt: any): PadNode {
        const condition = this.snippet(stmt.test);
        const thenBlock = this.parseStmt(stmt.consequent);
        const elseBlock = stmt.alternate ? this.parseStmt(stmt.alternate) : undefined;

        return {
            type: 'if',
            condition,
            then_block: thenBlock,
            else_block: elseBlock
        };
    }

    private snippet(node: any): string {
        return this.code.substring(node.start, node.end);
    }
}
