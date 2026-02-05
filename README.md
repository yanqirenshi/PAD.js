# PAD.js (Problem Analysis Diagram)

PAD.js は、プログラムコード（現在は JavaScript/TypeScript）を PAD (Problem Analysis Diagram) に変換・描画するための Web アプリケーションです。
Rust 製のバックエンド（WebAssembly）と React 製のフロントエンドで構成されています。

## プロジェクト構成

このプロジェクトは pnpm ワークスペースを使用したモノレポ構成になっています。

- **packages/app**: フロントエンドアプリケーション (React + Vite)
- **packages/core**: コアロジック (パーサー、D3.js レンダラーなど)
- **backend**: Rust バックエンド (WebAssembly にコンパイルされ、コアロジックから利用されます)

> [!NOTE]
> `frontend` ディレクトリはレガシーコードです。現在は `packages/` 以下のコードがメインです。

## 前提条件

- **Node.js**: v20 以上推奨
- **pnpm**: パッケージマネージャー
- **Rust**: バックエンドのビルドに必要（`wasm-pack` 等のツールチェーン含む）

## セットアップ

依存関係をインストールします。

```bash
pnpm install
```

## 開発

開発サーバーを起動します。

```bash
pnpm dev
# または
pnpm --filter @pad/app dev
```

ブラウザで `http://localhost:5173` (ポートは変更される可能性があります) を開いて確認してください。

## ビルド

プロジェクト全体をビルドします。

```bash
pnpm build
```

パッケージごとにビルドする場合:

```bash
# コアライブラリのみ
pnpm --filter @pad/core build

# アプリケーションのみ
pnpm --filter @pad/app build
```

## ドキュメント

Typedoc によるドキュメント生成:

```bash
pnpm docs
```
