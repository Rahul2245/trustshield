import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border shadow-lg",
          error: "border-red-200 bg-red-50 text-red-900",
          success: "border-green-200 bg-green-50 text-green-900",
        },
      }}
    />
  );
}
