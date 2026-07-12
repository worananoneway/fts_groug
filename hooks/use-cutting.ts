"use client";

import { useCuttingContext } from "@/components/cutting/cutting-provider";

export function useCutting() {
  return useCuttingContext();
}
