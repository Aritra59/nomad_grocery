import React from "react";
import { ArrowLeft } from "lucide-react";

export default function BackIcon({ size = 20, strokeWidth = 3, className = "" }) {
  // Keep styling driven by parent `color` when possible.
  return <ArrowLeft size={size} strokeWidth={strokeWidth} className={className} />;
}

