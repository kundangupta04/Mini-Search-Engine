import { useEffect, useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";

interface HealthResponse {
  status: string;
  message: string;
  time: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <Search className="w-12 h-12 text-indigo-600" />
      <h1 className="text-3xl font-bold">Search Engine</h1>
      <p className="text-slate-500">Setup check</p>

      {health && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          {health.message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          Cannot reach the server. Is it running?
        </div>
      )}
      {!health && !error && <p className="text-slate-400">Checking server...</p>}
    </div>
  );
}