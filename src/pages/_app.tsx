import Head from 'next/head';
import { defaultMeta } from '@/utils/seo';
import { AppProps } from 'next/app'; // AppProps をインポート
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{defaultMeta.title}</title>
        <meta name="description" content={defaultMeta.description} />
        <meta property="og:url" content={defaultMeta.url} />
        <meta property="og:image" content={defaultMeta.image} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
