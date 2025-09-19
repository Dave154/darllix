"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CheckoutStepper({ step }) {
  const steps = [
    { id: 1, label: "Information" },
    { id: 2, label: "Shipping" },
    { id: 3, label: "Payment" },
  ];

  return (
    <div className="mb-8">
        
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;

          return (
            <div key={s.id} className="flex-1 flex items-center">
                
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7  md:w-10 md:h-10 rounded-full border-2 text-xs md:text-sm font-medium transition-colors",
                  isCompleted
                    ? "bg-color2 border-color-2 text-color4"
                    : isActive
                    ? "border-color3 text-color3"
                    : "border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : s.id}
              </div>
              <div className="ml-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-black"
                      : isCompleted
                      ? "text-color2"
                      : "text-gray-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 flex items-center mx-2">
                  <Separator className="flex-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
