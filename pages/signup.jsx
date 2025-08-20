// Packages you likely want installed:
// npm i react-hook-form zod @hookform/resolvers @supabase/supabase-js framer-motion zxcvbn
// shadcn/ui assumed installed with Button, Input, Label, Separator, Checkbox, DropdownMenu components
// Tailwind CSS already set up

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@supabase/supabase-js";
import zxcvbn from "zxcvbn";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown, Eye, EyeOff, ShieldCheck, Mail, Lock, Apple, Chrome } from "lucide-react";
import Image from "next/image";

// Create Supabase client (client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Form schema using Zod (tight validation)
const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[0-9]/, "Add a number")
    .regex(/[^A-Za-z0-9]/, "Add a symbol"),
  human: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you are human" }),
  }),
});

export default function DarllixAuth() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema), defaultValues: { human: true } });

  const [country, setCountry] = useState("Nigeria");
  const [showPass, setShowPass] = useState(false);
  const password = watch("password") || "";

  const strength = useMemo(() => (password ? zxcvbn(password).score : 0), [password]);
  const strengthText = ["very weak", "weak", "fair", "good", "strong"][strength];
const images = ["/vendor1.jpg", "/vendor6.jpg", "/vendor6.jpg"]; 
 const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);


 
  async function onSubmit(values) {

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo:
            (typeof window !== "undefined" ? window.location.origin : "") + 
            "/auth/callback",
        },
      });
      if (error) throw error;
      alert("Check your email to verify your account.");
    } catch (err) {
      setError("email", { message: err?.message || "Failed to sign up" });
    }
  }

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

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_700px_at_80%_-10%,#6fd8ac_0%,transparent_60%),radial-gradient(1200px_700px_at_20%_110%,#4a21ef_0%,#0d0b33_60%)] text-white flex items-center justify-center md:p-4 pt-4">
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
                {["Nigeria", "Ghana"].map(
                  (c) => (
                    <DropdownMenuItem key={c} onClick={() => setCountry(c)}>
                      {c}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h1 className="text-2xl font-semibold">Create a Darllix account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Try Darllix for free. Lorem ipsum dolor sit amet elit.
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
                  placeholder="jsmith.mdobin@gmail.com"
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
              <div className="mt-2">
                <div className="h-2 w-full rounded bg-slate-200">
                  <div
                    className={`h-2 rounded transition-all`} 
                    style={{
                      width: `${((strength + 1) / 5) * 100}%`,
                      background:
                        strength >= 4
                          ? "#16a34a"
                          : strength >= 2
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 capitalize">Password strength: {strengthText}.</p>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{String(errors.password.message)}</p>
              )}
            </div>

            {/* Human checkbox */}
            <div className="flex items-center gap-3 rounded-md border p-4">
              <Checkbox id="human" {...register("human")} />
              <Label htmlFor="human" className="flex items-center gap-2 text-sm text-slate-700">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> I am human
              </Label>
            </div>
            {errors.human && (
              <p className="-mt-3 text-sm text-red-600">{String(errors.human.message)}</p>
            )}

            <Button type="submit" className="w-full h-11 bg-slate-900 text-white hover:bg-black text-base" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Darllix account"}
            </Button>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-slate-400">or</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <p className="text-sm text-slate-500">
              Already have a Darllix account? <a href="/login" className="underline">Log in</a>
            </p>

            <p className="text-xs text-slate-400">
              By proceeding, you agree to the <a className="underline" href="#">Terms and Conditions</a> and
              <a className="underline" href="#"> Privacy Policy</a>.
            </p>
          </form>
        </div>

        {/* Right panel – promo visual */}
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
          <div className="absolute opacity-30 inset-0 bg-gradient-to-br from-color3 via-color1 to-color4 z-20 " />
           <div className="relative z-10 flex h-full flex-col justify-end p-10">
            <blockquote className="max-w-md text-white">
              <p className="text-base opacity-90">
               "Lorem19 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
              </p>
              <footer className="mt-3 text-sm opacity-70"> Daniel Oseni, Founder .....</footer>
            </blockquote>
          </div> 
        </div>
      </motion.div>
    </div>
  );
}
