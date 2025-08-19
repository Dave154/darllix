// pages/_app.js
import Head from "next/head";
import "@/styles/globals.css";
import Script from "next/script";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      {/* <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="beforeInteractive"
      /> */}
      <Component {...pageProps} />
    </>
  );
}
