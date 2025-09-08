// pages/_app.js
import Head from "next/head";
import "@/styles/globals.css";
import Script from "next/script";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import Loader from "../components/dashboardComponents/loader";
import { useRouter } from "next/router";
import { Toaster } from "@/components/ui/sonner"



export default function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => createPagesBrowserClient());
  


  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
         {/* <Toaster />  */}
      <Component {...pageProps} />
    </SessionContextProvider>
    </>
  );
}
