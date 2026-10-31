import { Check, Plus } from "lucide-react";
import { formatPkr } from "@/lib/catalogue";
import type { MakeupProduct } from "@/lib/consultation-types";

interface Props {
  product: MakeupProduct;
  selected: boolean;
  /** True when three are already chosen and this one isn't among them. */
  full: boolean;
  onToggle: () => void;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function ProductCard({ product: p, selected, full, onToggle }: Props) {
  const disabled = !p.inStock || (full && !selected);
  const reason = !p.inStock ? "Out of stock" : full && !selected ? "Shortlist full" : null;
  return (
    <li className={`card flex flex-col overflow-hidden transition-shadow ${selected ? "ring-2 ring-ink" : ""} ${!p.inStock ? "opacity-60" : ""}`}>
      <div className="relative bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt={`${p.name}, sample illustration`} className="aspect-square w-full object-cover" />
        {p.isSampleProduct && <span className="tag absolute left-3 top-3 bg-white/90">Sample product</span>}
        <span className={`tag absolute right-3 top-3 ${p.inStock ? "tag-ok" : "tag-warn"}`}>{p.inStock ? "In stock" : "Out of stock"}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold leading-tight">{p.name}</p>
        <p className="mt-1 text-sm text-soft">Shade <span className="font-semibold text-ink">{p.shadeCode}</span> · {cap(p.finish)}</p>
        <p className="num mt-3 text-xl font-bold">{formatPkr(p.price)}</p>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={`${selected ? "Remove" : "Add"} ${p.name} ${selected ? "from" : "to"} shortlist`}
          className={`btn mt-4 w-full ${selected ? "" : "btn-outline"}`}
        >
          {selected ? <><Check size={16} aria-hidden /> Shortlisted</> : reason ?? <><Plus size={16} aria-hidden /> Add to shortlist</>}
        </button>
      </div>
    </li>
  );
}
