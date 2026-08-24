"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

// Free-text input with a themed suggestion dropdown — a styled alternative
// to native <datalist>, which renders as an unstyleable OS popup.
export function RoleCombobox({ value, onChange, options, placeholder, required, id, className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  const select = (role) => {
    onChange(role);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          className={cn("pr-9", className)}
          autoComplete="off"
        />
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform",
            open && "rotate-180"
          )}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg py-1">
          {filtered.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => select(role)}
              className="w-full text-left px-3 py-2 text-sm font-mono text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
