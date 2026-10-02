import { useState } from "react";
import { ArrowRight } from "lucide-react";
import DemoForm from "./DemoForm";
import { ErrorBox, LoadingLine } from "./Status";
import { useRemote } from "../../hooks/useRemote";
import { getSortDemo } from "../../services/dsaApi";
import type { SortDemoResponse } from "../../types/dsa";

type Order = "asc" | "desc";

function NumberChips({ values, strong = false }: { values: number[]; strong?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-slate-300">[</span>
      {values.map((value, i) => (
        <span
          key={i}
          className={`rounded px-1.5 py-0.5 font-mono text-sm ${
            strong ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          {value}
        </span>
      ))}
      <span className="text-slate-300">]</span>
    </span>
  );
}

export default function SortVisualizer() {
  const [input, setInput] = useState("5,2,9,1,7,3");
  const [order, setOrder] = useState<Order>("asc");
  const [submitted, setSubmitted] = useState<{ numbers: string; order: Order }>({
    numbers: "5,2,9,1,7,3",
    order: "asc",
  });

  const { data, error, loading } = useRemote(
    () => getSortDemo(submitted.numbers, submitted.order),
    `${submitted.numbers}|${submitted.order}`
  );

  function runExample(numbers: string): void {
    setInput(numbers);
    setSubmitted({ numbers, order });
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Enter up to 50 numbers separated by commas. Our own Merge Sort splits them in half again
        and again, then merges the sorted pieces back together.
      </p>
      <DemoForm
        value={input}
        onChange={setInput}
        onSubmit={() => setSubmitted({ numbers: input, order })}
        placeholder="e.g. 5,2,9,1,7,3"
        buttonLabel="Sort"
        examples={["5,2,9,1,7,3", "1,2,3,4,5,6,7,8", "9,8,7,6,5,4", "4,4,1,1"]}
        onExample={runExample}
        extra={
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as Order)}
            aria-label="Sort order"
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        }
      />

      <div className="mt-6">
        {loading && !data && <LoadingLine />}
        {error && <ErrorBox message={error} />}
        {data && !error && <SortResult data={data} />}
      </div>
    </div>
  );
}

function SortResult({ data }: { data: SortDemoResponse }) {
  const n = data.input.length;
  const bound = n <= 1 ? 0 : n * Math.ceil(Math.log2(n));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="text-xs text-slate-400">Before</div>
          <NumberChips values={data.input} />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300" />
        <div>
          <div className="text-xs text-slate-400">After ({data.order === "asc" ? "ascending" : "descending"})</div>
          <NumberChips values={data.sorted} strong />
        </div>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-slate-600">Every merge, in order</h3>
      {data.steps.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          A single number is already sorted, so no merging is needed.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"
            >
              <span className="w-14 shrink-0 font-mono text-xs text-slate-400">step {i + 1}</span>
              <NumberChips values={step.left} />
              <span className="text-slate-400">+</span>
              <NumberChips values={step.right} />
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <NumberChips values={step.merged} strong />
              {step.depth === 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  final merge
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        {n} {n === 1 ? "number" : "numbers"} · {data.steps.length} merges · {data.comparisons}{" "}
        comparisons{n > 1 && <> (upper bound n × ⌈log₂ n⌉ = {bound})</>} · {data.timeMs} ms.
        Time <span className="font-mono">O(n log n)</span>, extra space{" "}
        <span className="font-mono">O(n)</span>.
      </p>
    </div>
  );
}