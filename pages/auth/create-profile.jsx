import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "../../components/dashboardComponents/loader";

// ✅ Validation schema
const schema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  account_name: z.string().min(2, "Account name is required"),
  bank_name: z.string().min(2, "Bank name is required"),
  account_number: z.string().min(6, "Account number is required"),
  phone: z.string().min(6, "Phone number is required"),
});

export default function CreateProfile() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    if (!user) return;
    try {
      setLoading(true);
      const { error } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          full_name: values.full_name,
          account_name: values.account_name,
          bank_name: values.bank_name,
          account_number: values.account_number,
          phone: values.phone,
        },
      ]);
      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("full_name", {
        type: "manual",
        message: err.message || "Failed to create profile",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">
      {/* Left side with gradient + image */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <img
          src="/vendor1.jpg"
          alt="Profile setup"
          className="w-full opacity-65 max-h- object-cover"
        />
      </div>

      {/* Right side form */}
      <div className="flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-xl px-8 py-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Create Your Profile
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full ">
  {/* Full Name */}
  <div>
    <Label className="text-sm text-gray-700">Full Name</Label>
    <Input
      placeholder="John Doe"
      className="mt-2 h-14 w-full text-base px-4"
      {...register("full_name")}
    />
    {errors.full_name && (
      <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
    )}
  </div>


  {/* Bank Name */}
  <div>
    <Label className="text-sm text-gray-700">Bank Name</Label>
    <Input
      placeholder="First Bank"
      className="mt-2 h-14 w-full text-base px-4"
      {...register("bank_name")}
    />
    {errors.bank_name && (
      <p className="text-sm text-red-500 mt-1">{errors.bank_name.message}</p>
    )}
  </div>

  {/* Account Number */}
  <div>
    <Label className="text-sm text-gray-700">Account Number</Label>
    <Input
      placeholder="0123456789"
      className="mt-2 h-14 w-full text-base px-4"
      {...register("account_number")}
    />
    {errors.account_number && (
      <p className="text-sm text-red-500 mt-1">
        {errors.account_number.message}
      </p>
    )}
  </div>

  {/* Account Name */}
  <div>
    <Label className="text-sm text-gray-700">Account Name</Label>
    <Input
      placeholder="John Doe"
      className="mt-2 h-14 w-full text-base px-4"
      {...register("account_name")}
    />
    {errors.account_name && (
      <p className="text-sm text-red-500 mt-1">
        {errors.account_name.message}
      </p>
    )}
  </div>
  {/* Phone Number */}
  <div>
    <Label className="text-sm text-gray-700">Phone Number</Label>
    <Input
      placeholder="+2348012345678"
      className="mt-2 h-14 w-full text-base px-4"
      {...register("phone")}
    />
    {errors.phone && (
      <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
    )}
  </div>

  <Button
    type="submit"
    className="w-full h-14 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
    disabled={isSubmitting}
  >
    {loading ? "Saving..." : "Create Profile"}
  </Button>
</form>
        </motion.div>
      </div>
      {loading && <Loader />}
    </div>
  );
}
