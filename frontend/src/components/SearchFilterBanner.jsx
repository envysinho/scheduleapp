import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

function SearchFilterBanner({ label, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
      <span>
        Búsqueda: <span className="font-medium">{label}</span>
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        <X className="size-3.5" />
        Limpiar
      </Button>
    </div>
  );
}

export default SearchFilterBanner;
