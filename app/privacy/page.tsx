import Link from 'next/link';

const sections = [
  {
    title: '1. 基本方針',
    body: [
      'JP Typing Labは、日本語ローマ字入力の練習をブラウザ内で完結させることを前提にしています。',
      '練習中に入力された内容、練習結果、分析データ、設定情報は、利用者本人の端末上で処理されます。外部サーバーへ送信することを目的とした機能は実装していません。',
    ],
  },
  {
    title: '2. 保存される情報',
    body: [
      '本アプリは、機能提供のために以下の情報をブラウザ内に保存することがあります。',
      '・練習セッションの結果（日時、WPM、KPM、正確率、ミス数など）',
      '・問題ごとの入力結果、打鍵統計、反応時間、弱いキー、頻出ミス',
      '・表示設定、入力設定、フォーカスモード、アニメーション設定などの利用設定',
      'これらの情報は、タイピング結果の表示、進捗確認、弱点分析、設定保持のために利用されます。',
    ],
  },
  {
    title: '3. 保存場所',
    body: [
      '保存データは、利用中のブラウザのIndexedDBに保存されます。',
      'アカウント登録、ログイン、サーバーDBへの保存、クラウド同期は行いません。別のブラウザ、別の端末、別のブラウザプロファイルには自動で共有されません。',
    ],
  },
  {
    title: '4. 外部送信と第三者提供',
    body: [
      '本アプリは、練習履歴、入力内容、打鍵データ、分析結果を外部サーバーへ送信しません。',
      'また、これらの情報を第三者へ提供、販売、共有することはありません。',
    ],
  },
  {
    title: '5. Cookie・アクセス解析・広告',
    body: [
      '本アプリは、練習データの取得を目的としたCookie、アクセス解析ツール、広告配信ツールを使用しません。',
      '将来これらを導入する場合は、このプライバシーポリシーを更新し、利用目的を明記します。',
    ],
  },
  {
    title: '6. データの削除',
    body: [
      '保存済みの練習履歴は、設定ページの「ローカルデータ」から削除できます。',
      'また、ブラウザのサイトデータ削除、閲覧履歴削除、IndexedDB削除によっても保存データを消去できます。削除後の復元はできません。',
    ],
  },
  {
    title: '7. 注意事項',
    body: [
      'ブラウザのプライベートブラウズ、サイトデータの自動削除、ストレージ容量不足、端末の初期化などにより、保存データが失われる場合があります。',
      '共有端末で利用する場合は、ブラウザに保存されたデータを他の利用者が閲覧できる可能性があります。必要に応じて、利用後にローカルデータを削除してください。',
    ],
  },
  {
    title: '8. 改定',
    body: [
      '本ポリシーは、アプリの機能変更や運用方針の変更に応じて改定されることがあります。重要な変更がある場合は、ページ上で分かるように反映します。',
    ],
  },
] as const;

export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl px-4 pb-16">
    <header className="py-10">
      <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">プライバシーポリシー</h1>
      <p className="mt-5 leading-8 text-slate-600">JP Typing Labにおけるデータの取り扱いについて説明します。</p>
      <p className="mt-2 text-sm text-slate-500">制定日: 2026年5月19日</p>
    </header>

    <div className="space-y-9">
      {sections.map((section) => <section key={section.title}>
        <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
        <div className="mt-3 space-y-3 leading-8 text-slate-600">
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>)}
    </div>

    <div className="mt-12 text-sm text-slate-600">
      <Link href="/" className="font-semibold text-blue-700 hover:text-blue-800">トップページへ戻る</Link>
    </div>
  </main>;
}
