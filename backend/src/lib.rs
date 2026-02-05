mod model;
use model::PadNode;
use wasm_bindgen::prelude::*;
use syn::{parse_str, Block, Expr, Item, ItemFn, Stmt};

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

/// Rustコードを受け取り、PAD表示用のJSON文字列に変換するメイン関数
/// wasm-bindgenを通してJavaScriptから呼び出されます。
#[wasm_bindgen]
pub fn parse_rust_code(code: &str) -> String {
    // synクレートを使用して文字列としてのコードをRustの構文木（File）にパースしようと試みます
    match parse_str::<File>(code) {
        Ok(file) => {
            let mut nodes = Vec::new();
            // ファイル内のアイテム（関数など）を走査
            for item in file.items {
                if let Item::Fn(func) = item {
                   // 関数定義を見つけたらPADノードに変換
                   nodes.push(parse_function(func));
                }
            }
            if nodes.is_empty() {
                 serde_json::to_string(&PadNode::Error{ message: "No function found".to_string() }).unwrap()
            } else {
                 // 複数の関数がある場合も想定し、全体をSequenceとして返します
                 // これにより、フロントエンドは複数の関数ブロックを順に描画できます
                 serde_json::to_string(&PadNode::Sequence { children: nodes }).unwrap_or_else(|e| {
                    format!("{{\"type\": \"error\", \"message\": \"Serialization error: {}\"}}", e)
                 })
            }
        }
        Err(e) => {
             let msg = format!("Parse error: {}", e);
             serde_json::to_string(&PadNode::Error{ message: msg }).unwrap()
        }
    }
}

use syn::File;

/// 関数定義（ItemFn）を解析し、PADのBlockノードを作成します
fn parse_function(func: ItemFn) -> PadNode {
    let name = func.sig.ident.to_string();
    // 関数本体のブロックを解析
    let body = parse_block(*func.block);
    PadNode::Block {
        label: format!("fn {}()", name), // ラベルとして関数名を使用
        children: vec![body],
    }
}

/// コードブロック（{}で囲まれた部分）を解析し、Sequenceノードを作成します
fn parse_block(block: Block) -> PadNode {
    let mut children = Vec::new();
    // ブロック内の各ステートメント（文）を順に解析
    for stmt in block.stmts {
        children.push(parse_stmt(stmt));
    }
    PadNode::Sequence { children }
}

/// 個々のステートメント（文）を解析し、適切なPADノードに変換します
fn parse_stmt(stmt: Stmt) -> PadNode {
    match stmt {
        Stmt::Local(local) => {
             // ローカル変数定義（let x = ...;）
             // quote!マクロを使って元のソースコード表現に戻し、Commandノードとします
             let parsed = quote::quote!(#local).to_string();
             PadNode::Command { label: parsed }
        }
        Stmt::Item(_item) => PadNode::Command { label: "Inner item not supported".to_string() },
        Stmt::Expr(expr, _semi) => {
             // 式（if, while, 関数呼び出しなど）
             parse_expr(expr)
        },
        Stmt::Macro(mac) => {
             // マクロ呼び出し（println!など）
             let parsed = quote::quote!(#mac).to_string();
            PadNode::Command { label: parsed }
        }
    }
}

/// 式（Expr）を解析し、制御構造（If, While, For）や単純なコマンドに分類します
fn parse_expr(expr: Expr) -> PadNode {
    match expr {
        Expr::If(expr_if) => {
             // if文の解析
             let cond = &expr_if.cond;
             let cond_str = quote::quote!(#cond).to_string(); 
             
             // Then節（真の場合）
             let then_node = parse_block(expr_if.then_branch);
             
             // Else節（偽の場合）
             let else_node = if let Some((_, else_branch)) = expr_if.else_branch {
                 Some(Box::new(parse_expr(*else_branch)))
             } else {
                 None
             };
             
             PadNode::If {
                 condition: cond_str.replace(" . ", "."), // quote!の出力調整（ドットの前後のスペース除去など）
                 then_block: Box::new(then_node),
                 else_block: else_node,
             }
        }
        Expr::While(expr_while) => {
            // while文の解析
            let cond = &expr_while.cond;
            let cond_str = quote::quote!(#cond).to_string();
            let body = parse_block(expr_while.body);
            PadNode::Loop {
                condition: cond_str,
                body: Box::new(body),
            }
        }
        Expr::ForLoop(expr_for) => {
             // forループの解析
             let pat = quote::quote!(#expr_for.pat).to_string(); // パターン（例: i）
             let expr = quote::quote!(#expr_for.expr).to_string(); // 反復対象（例: 0..10）
             let body = parse_block(expr_for.body);
             PadNode::Loop {
                 condition: format!("for {} in {}", pat, expr),
                 body: Box::new(body),
             }
        }
        Expr::Block(expr_block) => {
            // 内側のブロック（スコープ作成など）
            parse_block(expr_block.block)
        }
        _ => {
            // その他の式は単純なコマンドとして扱う（関数呼び出し、代入など）
            let label = quote::quote!(#expr).to_string();
            PadNode::Command { label }
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
