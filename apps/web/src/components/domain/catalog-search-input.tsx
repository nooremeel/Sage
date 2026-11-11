'use client';

import * as React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { Search, X } from 'lucide-react';

interface CatalogSearchInputProps {
  defaultValue?: string;
  placeholder: string;
  searchBtnText: string;
  clearSearchText?: string;
}

export function CatalogSearchInput({
  defaultValue = '',
  placeholder,
  searchBtnText,
  clearSearchText = 'Clear',
}: CatalogSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = React.useState(defaultValue);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = React.useRef(false);

  // Sync state if defaultValue changes externally (e.g. navigation or reset)
  React.useEffect(() => {
    if (!isUserTypingRef.current) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const pushSearch = React.useCallback(
    (newQuery: string) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const trimmed = newQuery.trim();

      if (trimmed) {
        params.set('q', trimmed);
        params.delete('cursor'); // Reset pagination
      } else {
        params.delete('q');
        params.delete('cursor');
      }

      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    isUserTypingRef.current = true;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      pushSearch(val);
      isUserTypingRef.current = false;
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isUserTypingRef.current = false;
    pushSearch(query);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isUserTypingRef.current = false;
    setQuery('');
    pushSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl" role="search">
      <div className="relative flex items-center">
        <Search className="absolute start-3.5 h-4 w-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-md border border-border bg-card ps-10 pe-24 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-colors"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            title={clearSearchText}
            aria-label="Clear query input"
            className="absolute end-16 p-1 text-text-muted hover:text-text rounded-xs transition-colors focus-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="submit"
          className="absolute end-1.5 top-1.5 bottom-1.5 rounded-sm bg-primary px-3 text-xs font-medium text-white dark:text-slate-950 hover:bg-primary/90 transition-colors focus-ring"
        >
          {searchBtnText}
        </button>
      </div>
    </form>
  );
}
