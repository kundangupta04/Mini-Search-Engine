import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingLine({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {text}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}