# Rust/JavaScript to PAD Web Application

## プロジェクト概要

RustおよびJavaScriptのコードを **PAD（Problem Analysis Diagram / 問題分析図）** に変換・描画するWebアプリケーション。

### PADとは

PADはプログラムの論理構造を視覚的に表現するための図法です。フローチャートとは異なり、構造化プログラミングの考え方に基づき、順次・選択・繰り返しの制御構造を入れ子構造として表現します。

参考: [Wikipedia - PAD (ソフトウェア設計)](https://ja.wikipedia.org/wiki/PAD_%28%E3%82%BD%E3%83%95%E3%83%88%E3%82%A6%E3%82%A7%E3%82%A2%E8%A8%AD%E8%A8%88%29)

## アーキテクチャ

```
pad/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx              # メインアプリケーション
│   │   ├── types.ts             # PADノードの型定義
│   │   ├── components/          # PAD描画コンポーネント (D3.js使用)
│   │   ├── parsers/             # JavaScriptパーサー (acorn使用)
│   │   └── utils/               # ユーティリティ
│   └── package.json
├── backend/           # Rust (WebAssemblyにコンパイル)
│   ├── src/
│   │   ├── lib.rs               # Rustパーサー (syn使用)
│   │   └── model.rs             # PADノードのデータ構造
│   ├── pkg/                     # ビルド済みWasmパッケージ
│   └── Cargo.toml
└── CLAUDE.md
```

## 技術スタック

### フロントエンド

- **React 19** + **TypeScript**
- **Vite** - ビルドツール
- **D3.js** - PAD図の描画
- **acorn** - JavaScriptコードの解析

### バックエンド (Rust/Wasm)

- **syn** - Rustコードの構文解析
- **wasm-bindgen** - JS/Wasm間の通信
- **serde** / **serde_json** - JSONシリアライズ

## PADノード構造

```typescript
type PadNode =
  | { type: 'sequence'; children: PadNode[] }      // 順次
  | { type: 'if'; condition: string; then_block: PadNode; else_block?: PadNode }  // 選択
  | { type: 'loop'; condition: string; body: PadNode }  // 繰り返し
  | { type: 'command'; label: string }             // 処理
  | { type: 'block'; label: string; children: PadNode[] }  // 関数ブロック
  | { type: 'error'; message: string }             // エラー
```

## 開発コマンド

### フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

### Rustコードの変更後 (Wasmビルド)

```bash
cd backend
wasm-pack build --target web --out-dir pkg
```

## 対応する制御構造

### Rust

- `fn` - 関数定義
- `if` / `else` - 条件分岐
- `while` - ループ
- `for` - ループ
- `let` - 変数定義
- マクロ呼び出し (`println!` など)

### JavaScript

- `function` - 関数定義
- `if` / `else` - 条件分岐
- `while` - ループ
- `for` - ループ
- 変数宣言 (`let`, `const`, `var`)
- 関数呼び出し

## 日本語対応

- UIは日本語で表示
- コードのコメントも日本語で記載
- **Implementation Plan は日本語で作成すること**
- **Walkthrough は日本語で作成すること**

## ドキュメント生成

- **TSDoc記法** に従ってコメントを書く
- **TypeDoc** でHTMLドキュメントを生成
- **eslint-plugin-tsdoc** でコメント記法をリント

### 導入パッケージ

```bash
npm install --save-dev typedoc @microsoft/tsdoc eslint-plugin-tsdoc
```

### TSDocコメント例

```typescript
/**
 * PADノードをレンダリングするクラス
 * @param rootG - D3セレクション
 * @returns レンダリング結果
 */
```

