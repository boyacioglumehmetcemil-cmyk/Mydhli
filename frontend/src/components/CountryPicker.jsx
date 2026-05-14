/**
 * CountryPicker — the country/currency selector used in the utility bar and
 * the mobile drawer.
 *
 * Why a Command (combobox) instead of a flat DropdownMenu? With ~240
 * countries a plain list is unscannable. The shadcn `Command` primitive
 * provides fuzzy search + keyboard nav out of the box, grouped by region
 * for visual chunking.
 *
 * The trigger renders as a compact chip: 🌐 globe + 2-letter country code
 * + chevron. Selecting a country updates global state via `useCountry()`,
 * which persists to localStorage and re-labels every money display in the
 * app via `formatCurrency`.
 */
import { useMemo, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES, REGIONS, flagFor } from "@/data/countries";
import { useCountry } from "@/contexts/CountryContext";

/**
 * Group COUNTRIES by region once (module-scope) so the picker doesn't
 * rebuild the bucket map on every render.
 */
const COUNTRIES_BY_REGION = REGIONS.map((region) => ({
  region,
  items: COUNTRIES.filter((c) => c.region === region).sort((a, b) => a.name.localeCompare(b.name)),
}));

const CountryPicker = ({ variant = "chip", className = "" }) => {
  const { country, setCountry } = useCountry();
  const [open, setOpen] = useState(false);

  const handleSelect = (code) => {
    setCountry(code);
    setOpen(false);
  };

  // Two trigger styles. `chip` is the compact utility-bar pill; `row` is a
  // full-width list-item used inside the mobile drawer where the trigger
  // needs to look like the other menu rows.
  const trigger =
    variant === "row" ? (
      <button
        type="button"
        data-testid="country-picker-trigger"
        className={`w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-dhl-text hover:bg-dhl-panel ${className}`}
      >
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-dhl-muted" />
          <span>Country &amp; currency</span>
        </span>
        <span className="flex items-center gap-1.5 text-dhl-muted">
          <span>{flagFor(country.code)}</span>
          <span className="font-mono text-xs">{country.code}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>
    ) : (
      <button
        type="button"
        data-testid="country-picker-trigger"
        className={`text-sm font-medium h-8 px-3 inline-flex items-center gap-1.5 rounded-sm hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-dhl-red/40 ${className}`}
      >
        <Globe className="w-4 h-4" />
        <span data-testid="country-picker-code" className="font-mono">{country.code}</span>
        <ChevronDown className="w-[14px] h-[14px]" />
      </button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[360px] p-0 bg-white shadow-xl rounded-md border border-stone-200 overflow-hidden"
        data-testid="country-picker-panel"
      >
        <Command
          // Custom filter: match against name + code + region so users can
          // type "DE", "Germany", or "Europe" with equal success.
          filter={(value, search) => {
            if (!search) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Search country..."
            data-testid="country-picker-search"
          />
          <CommandList
            className="max-h-[420px] overflow-y-auto"
            data-testid="country-picker-list"
          >
            <CommandEmpty>No country found.</CommandEmpty>
            {COUNTRIES_BY_REGION.map(({ region, items }) => (
              <CommandGroup key={region} heading={region}>
                {items.map((c) => {
                  const isSelected = c.code === country.code;
                  return (
                    <CommandItem
                      key={c.code}
                      // `value` powers cmdk's filter — include name + code +
                      // language + currency so search hits any of them.
                      value={`${c.name} ${c.code} ${c.languageLabel} ${c.currency} ${c.region}`}
                      onSelect={() => handleSelect(c.code)}
                      data-country-row={c.code}
                      data-testid={`country-row-${c.code}`}
                      className="flex items-center gap-2.5 py-2 cursor-pointer"
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {flagFor(c.code)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-sm text-dhl-text truncate block">{c.name}</span>
                        <span className="text-[11px] text-stone-500">
                          {c.languageLabel} · {c.currency}
                        </span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-dhl-red shrink-0" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountryPicker;
