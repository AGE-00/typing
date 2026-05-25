import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '実装ノート | JP Typing Lab',
  description: 'JP Typing Labの入力判定、出題、保存、分析の設計メモです。',
};

const competitors = [
  ['e-typing', '結果画面で速度、正確性、苦手キーをすぐ確認できる。'],
  ['寿司打', '短い時間で遊べるゲーム性とコース選択が分かりやすい。'],
  ['マイタイピング', '問題量と投稿文化があり、練習テーマを選びやすい。'],
  ['KeyDown', '入力傾向に合わせて出題を寄せる適応練習がある。'],
] as const;

const files = [
  ['app/practice/page.tsx', '練習開始、キー入力、セッション保存'],
  ['app/analysis/page.tsx', '履歴、進捗、弱点キー、ミス傾向の可視化'],
  ['lib/typing/romanization.ts', 'かなからローマ字候補を生成し、入力中の候補を選ぶ'],
  ['lib/typing/practice-selection.ts', '問題フィルタ、弱点キー優先、入力イベント整形'],
  ['lib/typing/analysis.ts', 'WPM/KPM、正確率、キー別統計、ミス集計'],
  ['lib/db.ts', 'IndexedDB/Dexieのスキーマと保存処理'],
] as const;

const metrics = [
  ['accuracy', 'correctInputs / totalInputs'],
  ['kpm', 'correctInputs / activeMinutes'],
  ['wpm', 'correctInputs / 5 / activeMinutes'],
  ['weakKeys', 'mistakes desc, accuracy asc, attempts desc'],
  ['slowKeys', 'averageReactionMs desc'],
  ['mistakes', 'expected -> actual の出現回数'],
] as const;

export default function AboutPage() {
  return <main className="mx-auto max-w-3xl px-4 pb-20">
    <article className="prose-doc py-8">
      <p className="text-sm text-slate-500">JP Typing Lab / implementation notes</p>
      <h1>実装ノート</h1>
      <p>
        JP Typing Lab は、練習中の入力をブラウザ内にだけ残し、その記録から次の練習を組み立てるタイピングサイトです。
        速度だけでなく、どのキーで迷ったか、どの打ち間違いが続いているかを見て、短い練習でも改善点を拾えるようにしています。
      </p>

      <h2>位置づけ</h2>
      <p>
        既存の日本語タイピングサイトには、それぞれ分かりやすい良さがあります。
        このサイトではランキングや投稿よりも、手元の打鍵データから自分の傾向を読み、次の出題へ反映する体験を中心に置いています。
      </p>
      <table>
        <thead><tr><th>競合</th><th>強い点</th></tr></thead>
        <tbody>
          {competitors.map(([name, note]) => <tr key={name}><td>{name}</td><td>{note}</td></tr>)}
        </tbody>
      </table>
      <p>
        サーバーに入力ログを送らないので、記録は自分のブラウザ内に閉じます。
        その制約を弱点ではなく特徴として扱い、ローカルデータだけで分析とパーソナライズを成立させています。
      </p>

      <h2>データの流れ</h2>
      <ol>
        <li>練習条件から問題候補を絞る。</li>
        <li>かな読みをローマ字候補に変換する。</li>
        <li>キー入力ごとに期待キー、実キー、正誤、反応時間、対象文字を記録する。</li>
        <li>セッション終了時に集計済みサマリーと入力イベントをIndexedDBへ保存する。</li>
        <li>分析ページで保存済みセッションを再集計し、キー別の傾向とミスの流れを表示する。</li>
      </ol>

      <h2>出題</h2>
      <p>
        問題文は `lib/typing/practice-texts.ts` に内蔵しています。現在の生データは 7,722 件です。
        各問題は `lengthType`、`difficulty`、`category`、`tags`、`containsDifficultPatterns` を持ちます。
      </p>
      <p>
        通常の出題では、指定された長さ・難易度・カテゴリを最後まで守ります。
        条件に合う問題数が要求数より少ない場合も、別条件の問題では補充しません。
      </p>
      <p>
        パーソナライズが有効な場合は、直近セッションからミスが多いキーを取り出し、
        同じ条件内でそのキーを含む問題を前に寄せます。条件は守ったまま、練習の密度だけを上げる設計です。
      </p>

      <h2>ローマ字判定</h2>
      <p>
        表示上のローマ字は設定に応じてヘボン式または訓令式を基準にします。
        ただし入力判定では `shi/si` や `chi/ti` のような一般的な揺れを受け付けます。
        入力中は現在の `typed` から成立する候補を選び、ローマ字ラインを横へ流して現在位置を追いやすくしています。
      </p>

      <h2>保存</h2>
      <p>
        保存先はブラウザ内のIndexedDBです。Dexie.jsを使い、セッション、問題ごとの結果、キー入力イベント、設定を分けて保存します。
        アカウントやサーバーDBを使わず、分析に必要な情報だけを端末内に残します。
      </p>

      <h2>分析指標</h2>
      <table>
        <thead><tr><th>指標</th><th>計算</th></tr></thead>
        <tbody>
          {metrics.map(([name, formula]) => <tr key={name}><td><code>{name}</code></td><td><code>{formula}</code></td></tr>)}
        </tbody>
      </table>

      <h2>主要ファイル</h2>
      <table>
        <thead><tr><th>ファイル</th><th>責務</th></tr></thead>
        <tbody>
          {files.map(([path, note]) => <tr key={path}><td><code>{path}</code></td><td>{note}</td></tr>)}
        </tbody>
      </table>

      <h2>今後伸ばしたいところ</h2>
      <ul>
        <li>単キーだけでなく、`sha`、`kyo`、`nn` のようなn-gram単位でも傾向を見る。</li>
        <li>練習後に、次に試す練習を1つだけ提示する。</li>
        <li>初心者、速度重視、正確性重視、弱点集中などのコースを用意する。</li>
        <li>分析ページで期間フィルタ、条件別比較、前回比を見られるようにする。</li>
        <li>問題文を外部投稿に広げる場合は、モデレーションとローカル優先設計を合わせて考える。</li>
      </ul>

      <h2>参考にした競合</h2>
      <ul>
        <li><a href="https://www.e-typing.ne.jp/roma/check/">e-typing 腕試しレベルチェック</a></li>
        <li><a href="https://typing.twi1.me/index/">マイタイピング</a></li>
        <li><a href="https://keydown.io/">KeyDown</a></li>
        <li><a href="https://typingdouzo.com/">Douzo</a></li>
      </ul>

      <p><Link href="/settings">設定へ戻る</Link></p>
    </article>
  </main>;
}
