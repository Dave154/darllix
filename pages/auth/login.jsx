import { supabaseServer } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";




// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  ChevronDown,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Apple,
  Chrome,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";

import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { supabaseBrowser, getSupabaseServer } from "@/lib/supabaseClient";
import Loader from "../../components/dashboardComponents/loader";
import { toast, Toaster } from "sonner";
    import { sendEmail } from "@/lib/emailClient";
import { EMAIL_TEMPLATES } from "@/lib/emailTemplates";

export async function getServerSideProps(ctx) {
  const supabase = getSupabaseServer(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return {
      redirect: { destination: "/dashboard", permanent: false },
    };
  }
  return { props: {} };
}

// Validation schema
const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  });
  
  
  
  
 
export default function DarllixLogin() {
    const supabase = useSupabaseClient();

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  const [country, setCountry] = useState("Nigeria");
  const [showPass, setShowPass] = useState(false);
  const [loading,setLoading]  = useState(false)

  // Slideshow images
  const images = ["/vendor1.jpg", "/vendor6.jpg", "/vendor6.jpg"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle login

   async function onSubmit(values) {
    setLoading(true)
    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) throw error;

    const { data: { session }, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    console.log(values.email)

    // await sendEmail(EMAIL_TEMPLATES.login, {
    //   // user_name: "Dave",
    //   user_email: values.email,
    //   to_email: values.email,
    // });
    router.push(`/dashboard`);
   } catch (err) {
    if (err.message === 'Failed to fetch'){
      toast.error('Network error')
    }else{
      setError("email", {
       type: "manual",
       message: err?.message || "Failed to log in",
      });
    }
   }finally{
    setLoading(false)
   }
 }

  // OAuth
  const oauth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          (typeof window !== "undefined" ? window.location.origin : "") +
          "/auth/callback",
        queryParams: { prompt: "consent" },
      },
    });
  };

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);
  return (
    <>
    <Toaster
          position="top-right"
        />
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_700px_at_80%_-10%,#6fd8ac_0%,transparent_60%),radial-gradient(1200px_700px_at_20%_110%,#4a21ef_0%,#fff_60%)] text-white flex items-center justify-center md:p-4 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto grid w-full max-w-7xl grid-cols-1 overflow-hidden rounded-2xl bg-white/5 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/10 md:grid-cols-2"
      >
        {/* Left panel – form */}
        <div className="p-6 md:p-12 bg-white text-slate-900 text-base">
          <div className="mb-4 flex items-center gap-3">
            <img src="/darllix_logo.png" alt="Darllix logo" className="h-8 w-8" />
            <span className="text-xl font-bold">Darllix</span>
          </div>

          {/* Country dropdown */}
          <div className="mb-4 flex items-center justify-end gap-2 text-sm text-slate-500">
            <Globe className="h-4 w-4" />
            <span>I’m located in</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm shadow-sm">
                  <span>{country}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-60 w-56 overflow-y-auto">
                {["Nigeria"].map((c) => (
                  <DropdownMenuItem key={c} onClick={() => setCountry(c)}>
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h1 className="text-2xl font-semibold">Welcome back to Darllix</h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to continue to your dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 text-base">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm text-slate-700">
                Email
              </Label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11 text-base"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{String(errors.email.message)}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm text-slate-700">
                Password
              </Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="pl-10 pr-12 h-11 text-base"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{String(errors.password.message)}</p>
              )}
              <div className="mt-2 text-right">
                <a href="/forgot-password" className="text-sm text-slate-500 underline">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 text-white hover:bg-black text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>

            {/* Or */}
            {/* <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-slate-400">or</span>
              <Separator className="flex-1" />
            </div> */}

            {/* OAuth */}
            {/* <div className="grid grid-cols-1 gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => oauth("google")}
              >
                <Chrome className="mr-2 h-5 w-5" /> Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => oauth("apple")}
              >
                <Apple className="mr-2 h-5 w-5" /> Continue with Apple
              </Button>
            </div> */}

            <p className="text-sm text-slate-500">
              Don’t have a Darllix account?{" "}
              <a href="/auth/signup" className="underline">
                Sign up
              </a>
            </p>
          </form>
        </div>

        {/* Right panel – promo */}
        <div className="relative hidden md:block overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={images[index]}
                alt={`Promo ${index}`}
                width={1200}
                height={1200}
                className="h-full w-full object-contain"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 opacity-45 bg-gradient-to-br from-color3 via-color1 to-color4" />
          <div className="relative z-10 flex h-full flex-col justify-end p-10">
            <blockquote className="max-w-md text-white">
              <p className="text-base opacity-90">
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt."
              </p>
              <footer className="mt-3 text-sm opacity-70">
                Daniel Oseni, Founder .....
              </footer>
            </blockquote>
          </div>
        </div>
      </motion.div>
                {loading &&  <Loader />}
    </div>
              </>
  );
}
