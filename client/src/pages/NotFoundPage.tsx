import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="pt-16 text-center">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="mt-2 text-slate-500">That page does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-indigo-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
}