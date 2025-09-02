// components/store/ColorInput.jsx
"use client";
import React from "react";

export default function ColorInput({ label, value = "#ffffff", onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 p-0 border rounded" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-28 border rounded p-1 text-xs mt-1" />
      </div>
    </div>
  );
}
