import { SearchIcon } from "@/admin/lib/icons";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({ placeholder = "SEARCH...", value, onChange }: SearchInputProps) {
  return (
    <label className="relative block w-full">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        className="h-10 w-full bg-[var(--surface-mid)] pl-10 pr-3 text-[10px] font-black uppercase tracking-[0.22em] text-primary outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
