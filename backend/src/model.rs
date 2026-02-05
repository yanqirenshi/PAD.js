use serde::{Serialize};

/// PAD（Problem Analysis Diagram）の各ノードを表すデータ構造
/// Rustのコード解析結果はこの構造体のツリーとして表現され、フロントエンドにJSONとして送信されます。
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PadNode {
    /// 順次処理（Sequence）: 複数の処理が上から順に実行されることを表します
    Sequence { children: Vec<PadNode> },

    /// ブロック（Block）: 関数定義など、名前付きの処理の塊を表します
    Block { label: String, children: Vec<PadNode> },

    /// 条件分岐（If/Selection）: 条件によって処理が分岐する構造を表します
    If {
        condition: String,                 // 条件式の内容（"x > 0" など）
        then_block: Box<PadNode>,          // 条件が真の場合の処理（右上に配置）
        else_block: Option<Box<PadNode>>,  // 条件が偽の場合の処理（右下に配置、省略可能）
    },

    /// 反復処理（Loop/Repetition）: 条件を満たす間、処理を繰り返す構造を表します
    /// 現在は前判定ループ（while, for）に対応しています
    Loop {
        condition: String, // ループの継続条件
        body: Box<PadNode>, // 繰り返される処理本体
    },

    /// 単純な命令（Command/Process）: "let x = 1;" や関数呼び出しなどの単一の処理文
    Command { label: String },

    /// エラー（Error）: 解析不能な構文やエラー発生時用
    Error { message: String },
}
