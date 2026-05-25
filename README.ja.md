# JP Typing Lab（日本語）

英語版が標準です。English README: [README.md](README.md)

日本語文を見ながらローマ字入力を練習する、ブラウザ完結のタイピング練習アプリです。入力データはサーバーへ送信せず、ブラウザ内のIndexedDBに保存します。

## できること

- アカウントなしですぐに練習開始
- 日本語文をローマ字で入力して練習
- キー単位のミス、反応時間、弱点キーを記録
- セッション結果と問題別の内訳を確認
- WPM/正確率の長期推移をダッシュボードで確認
- 詳細分析（頻出ミス、遅いキー、非効率ローマ字）
- 入力・アニメーション設定の調整

## 画面 / ルーティング

- /: スタート画面
- /practice: タイピング練習 + 条件選択
- /result/[id]: セッション結果
- /mypage: 長期進捗ダッシュボード
- /analysis: 詳細分析
- /settings: 設定
- /about: 解析アルゴリズム紹介

## 練習フロー

- 条件選択: 問題数 / 文の長さ / 難易度 / カテゴリ
- オプション:
  - Strict Mode: 1ミスでセッション終了し、失敗情報を記録
  - Focus Mode: ナビゲーションなどを隠して集中
  - 制限時間: 30/60/120秒 or なし
- 入力開始: IMEではなくキーイベントを直接取得
- 結果を集計してローカル保存

## 解析パイプライン

1) ローマ字候補を生成（例: shi/si, chi/ti, tsu/tu）
2) 打鍵を記録（期待キー/実際キー/正誤/反応時間）
3) セッション指標を集計（WPM/KPM, 正確率, ミス, 弱い/遅いキー）
4) 保存履歴から長期傾向と入力習慣を抽出

## 指標

- 正確率: 正確入力数 / 全入力数
- KPM: 正確入力キー数 / 分
- WPM: 正確入力文字数 / 5 / 分
- 弱いキー: ミス数 → 正確率 → 試行数 の順で並び替え
- 遅いキー: 平均反応時間が長いキー
- ミスパターン: expected → actual の置換ペア
- ローマ字効率: 入力した長さと最短候補の比率

## データ保存とプライバシー

- 認証なし
- サーバーDBなし
- 入力データの外部送信なし
- Dexie.js経由でIndexedDBに保存

保存対象（MVPに必要な最小限）:
- 練習セッション（集計指標と選択条件）
- 問題別結果（Prompt Results）
- 打鍵イベント（Input Events）
- ユーザー設定

## 技術スタック

- Next.js（App Router）
- TypeScript
- React
- Tailwind CSS v4 + @tailwindcss/postcss
- lucide-react
- IndexedDB + Dexie.js
- Recharts
- Vitest + jsdom

## 主要ディレクトリ

app/
  page.tsx                 Start screen
  practice/page.tsx        Typing practice screen
  result/[id]/page.tsx     Session result screen
  mypage/page.tsx          Personal dashboard
  analysis/page.tsx        Detailed analysis page
  settings/page.tsx        Configuration page
  about/page.tsx           Algorithm overview
  layout.tsx               Root layout + navigation
  globals.css              Global styles / Tailwind entry

components/
  nav.tsx                  Global navigation
  ui.tsx                   Small local UI primitives
  typing/                  Typing UI components
  practice-options/        Option UI components
  motion/                  Motion provider

lib/
  db.ts                    Dexie / IndexedDB schema and helpers
  types.ts                 Shared domain types
  utils.ts                 Formatting and className utilities
  typing/                  Typing/analysis logic

tests/
  typing.test.ts           Romanization and analysis tests
  practice-options.test.ts Practice options logic tests
  motion-settings.test.ts  Motion preference tests

## 開発コマンド

bun install
bun run dev      # 開発サーバー起動
bun run build    # production build
bun run start    # build後のproduction server起動
bun run test     # Vitest実行
bun run lint     # TypeScript型チェック(tsc --noEmit)

## 開発時の注意

- ブラウザAPI、IndexedDB、window、crypto.randomUUID() などを使う画面はClient Componentとして実装する
- SSR/ハイドレーション差分を避けるため、初期表示で Math.random() や時刻依存の値を直接出さない
- Rechartsは空データ時に幅/高さ警告が出やすいので、データがない場合はチャートではなくEmpty Stateを表示する
- 入力練習画面はデスクトップキーボード前提。IME直接入力ではなく、英字キーイベントを扱う
- 新しい分析ロジックを追加する場合は、まず tests/typing.test.ts に期待仕様を追加してから実装する
- ローカルDBのスキーマ変更時は lib/db.ts のDexie version管理を更新する

## 品質ゲート

変更後は最低限以下を実行してください。

bun run test
bun run lint
bun run build

## パッケージ管理

このプロジェクトでは、依存関係管理とスクリプト実行に Bun 1.3.14 を使います。

移行時のローカルベンチメモ:

- lockfile なしの clean install: Bun 1.89秒、npm 19.02秒
- `lint` / `test`: Bun と npm はほぼ同等
- `build`: `next build` の処理が支配的なため、Bun と npm はほぼ同等
