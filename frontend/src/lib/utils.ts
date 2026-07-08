import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskScore(score: number): string {
  return `${score.toFixed(1)}%`;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "text-red-600 bg-red-50 border-red-200";
    case "HIGH":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    default:
      return "text-green-600 bg-green-50 border-green-200";
  }
}

export function getActionColor(action: string): string {
  switch (action) {
    case "BLOCK":
      return "bg-red-100 text-red-700";
    case "SHADOW":
      return "bg-purple-100 text-purple-700";
    case "MONITOR":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-green-100 text-green-700";
  }
}
