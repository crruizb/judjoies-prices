import { useState, useMemo } from "react";
import { useSheetData } from "../hooks/useSheetData";
import {
  getFilterFields,
  getFilteredValues,
  matchPrice,
} from "../utils/filters";
import FilterSelect from "./FilterSelect";
import PriceDisplay from "./PriceDisplay";
import LoadingSpinner from "./LoadingSpinner";

const SHEET_URL = import.meta.env.VITE_SHEET_URL ?? "";

export default function PriceCalculator() {
  const { data, loading, error, refresh } = useSheetData(SHEET_URL);
  console.log("Loaded data:", data);
  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    {},
  );

  const filterFields = useMemo(() => getFilterFields(data), [data]);

  const handleChange = (field: string, value: string | null) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value ?? undefined };
      // Clear downstream fields that may no longer be valid
      const idx = filterFields.indexOf(field);
      filterFields.slice(idx + 1).forEach((f) => {
        delete next[f];
      });
      return next;
    });
  };

  const handleReset = () => setFilters({});

  const price = useMemo(
    () => matchPrice(data, filters, filterFields),
    [data, filters, filterFields],
  );

  const allSelected = filterFields.every((f) => filters[f]);
  console.log(filterFields, filters, price);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full max-w-xl mx-auto px-6 pt-8 pb-12 flex flex-col gap-8 animate-fade-up">
      {/* Header */}
      <header className="text-center flex flex-col items-center gap-[0.6rem]">
        <div
          className="text-xl text-gold animate-pulse-gold"
          aria-hidden="true"
        >
          ◆
        </div>
        <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-medium tracking-[0.04em] text-text-primary">
          JUDjoies
        </h1>
        {error && (
          <p className="font-body text-xs text-error">
            ⚠ {error} — usando caché local
          </p>
        )}
      </header>

      {/* Filters */}
      <section
        className="flex flex-col gap-5"
        aria-label="Opciones del producto"
      >
        {filterFields.map((field, i) => {
          const prevField = filterFields[i - 1];
          const isLocked = i > 0 && !filters[prevField];
          const options = getFilteredValues(data, field, filters);

          return (
            <FilterSelect
              key={field}
              field={field}
              value={filters[field] ?? ""}
              options={options}
              onChange={handleChange}
              disabled={isLocked}
            />
          );
        })}
      </section>

      {/* Price result */}
      <PriceDisplay price={price} allSelected={allSelected} />

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          className="min-h-13 px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-border-line bg-transparent text-text-muted hover:border-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={handleReset}
          disabled={Object.keys(filters).length === 0}
          aria-label="Limpiar selección"
        >
          Limpiar
        </button>
        <button
          className="min-h-[52px] px-4 rounded font-body text-[0.85rem] font-medium tracking-[0.06em] uppercase cursor-pointer transition-all border border-[rgba(201,168,76,0.3)] bg-transparent text-gold-muted hover:bg-[rgba(201,168,76,0.08)] hover:border-gold-muted hover:text-gold"
          onClick={refresh}
          aria-label="Actualizar datos desde la hoja"
        >
          ↺ Actualizar datos
        </button>
      </div>

      <footer className="text-center pt-2 border-t border-border-line">
        <p className="font-body text-[0.7rem] text-text-dim tracking-[0.04em]">
          Los precios se actualizan automáticamente desde la hoja de cálculo.
        </p>
      </footer>
    </div>
  );
}
