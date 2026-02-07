import { DollarSign } from "lucide-react";

interface CurrencySelectorProps {
  currency: "RWF" | "USDT";
  onChange: (c: "RWF" | "USDT") => void;
}

const CurrencySelector = ({ currency, onChange }: CurrencySelectorProps) => (
  <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
    <button
      onClick={() => onChange("RWF")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        currency === "RWF"
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <DollarSign className="w-3 h-3" /> FRW
    </button>
    <button
      onClick={() => onChange("USDT")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        currency === "USDT"
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <DollarSign className="w-3 h-3" /> USDT
    </button>
  </div>
);

export default CurrencySelector;
