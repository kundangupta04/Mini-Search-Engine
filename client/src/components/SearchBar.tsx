import { useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchSuggestions } from "../services/api";

interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  large?: boolean;
}

export default function SearchBar({
  initialValue = "",
  autoFocus = false,
  large = false,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Autocomplete: ask the server's Trie, 150 ms after the user stops typing.
  useEffect(() => {
    // Nothing to complete when the box is empty or the user just typed a space.
    if (value.trim() === "" || /\s$/.test(value)) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchSuggestions(value)
        .then((response) => {
          if (cancelled) return;
          setSuggestions(response.suggestions);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  function runSearch(query: string): void {
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  /** Replace the word being typed with the chosen suggestion, then search. */
  function selectSuggestion(word: string): void {
    const completed = value.replace(/[a-z0-9]*$/i, word);
    setValue(completed);
    runSearch(completed);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    runSearch(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const visible = open && suggestions.length > 0;

    if (event.key === "ArrowDown" && visible) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && visible) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && visible && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && suggestions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-full border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 ${
          large ? "px-6 py-4" : "px-4 py-2.5"
        }`}
      >
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={200}
          placeholder="Search the knowledge base..."
          aria-label="Search"
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent outline-none placeholder:text-slate-400 ${
            large ? "text-lg" : "text-base"
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

      {showDropdown && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((word, i) => (
            <li
              key={word}
              // onMouseDown (not onClick) fires BEFORE the input loses focus,
              // so the dropdown is still there when we select.
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(word);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 ${
                i === activeIndex ? "bg-indigo-50" : ""
              }`}
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span>{word}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}