import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { Car, ParkingCircle } from "lucide-react";

interface ParkingSpotGridProps {
  spots: Tables<"parking_spots">[];
  onSpotClick?: (spot: Tables<"parking_spots">) => void;
  selectedSpotId?: string;
}

const statusColors: Record<string, string> = {
  available: "bg-[hsl(var(--spot-available))] hover:bg-[hsl(var(--spot-available))]/80 text-white cursor-pointer",
  occupied: "bg-[hsl(var(--spot-occupied))] text-white cursor-not-allowed",
  reserved: "bg-[hsl(var(--spot-reserved))] text-white cursor-not-allowed",
};

const ParkingSpotGrid = ({ spots, onSpotClick, selectedSpotId }: ParkingSpotGridProps) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {spots.map((spot) => (
        <button
          key={spot.id}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg p-3 transition-all text-xs font-medium h-20",
            statusColors[spot.status],
            selectedSpotId === spot.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          onClick={() => spot.status === "available" && onSpotClick?.(spot)}
          disabled={spot.status !== "available"}
        >
          {spot.status === "occupied" ? (
            <Car className="h-5 w-5 mb-1" />
          ) : (
            <ParkingCircle className="h-5 w-5 mb-1" />
          )}
          <span>{spot.spot_number}</span>
        </button>
      ))}
    </div>
  );
};

export default ParkingSpotGrid;
