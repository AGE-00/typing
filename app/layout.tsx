import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { Nav } from '@/components/nav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const themeScript = `(function(){try{var t=localStorage.getItem('jp-typing-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute('content',t);}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';}})();`;

export const metadata: Metadata = {
  title: 'JP Typing Lab',
  description: '日本語ローマ字入力をデータで改善するタイピング練習アプリ',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return <html lang="ja" data-motion="minimal" suppressHydrationWarning><head><meta name="color-scheme" content="light dark" /><script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className={`${geistSans.variable} ${geistMono.variable}`}><MotionProvider /><Nav />{children}</body></html>;
}
