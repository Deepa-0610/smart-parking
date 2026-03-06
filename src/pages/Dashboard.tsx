import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ParkingSpotGrid from "@/components/ParkingSpotGrid";
import AppLayout from "@/components/AppLayout";
import type { Tables } from "@/integrations/supabase/types";
import { ParkingCircle, Car, Clock } from "lucide-react";

const Dashboard = () => {
  const [zones, setZones] = useState<Tables<"parking_zones">[]>([]);
  const [spots, setSpots] = useState<Tables<"parking_spots">[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: zonesData } = await supabase.from("parking_zones").select("*");
      const { data: spotsData } = await supabase.from("parking_spots").select("*");
      if (zonesData) setZones(zonesData);
      if (spotsData) setSpots(spotsData);
      if (zonesData?.length && !selectedZone) setSelectedZone(zonesData[0].id);
    };
    fetchData();

    const channel = supabase
      .channel("spots-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_spots" }, (payload) => {
        setSpots((prev) => {
          const updated = payload.new as Tables<"parking_spots">;
          return prev.map((s) => (s.id === updated.id ? updated : s));
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const available = spots.filter((s) => s.status === "available").length;
  const occupied = spots.filter((s) => s.status === "occupied").length;
  const reserved = spots.filter((s) => s.status === "reserved").length;
  const filteredSpots = selectedZone ? spots.filter((s) => s.zone_id === selectedZone) : spots;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parking Dashboard</h1>
          <p className="text-muted-foreground">Real-time parking availability</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-[hsl(var(--spot-available))]/10">
                <ParkingCircle className="h-6 w-6 text-[hsl(var(--spot-available))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-[hsl(var(--spot-occupied))]/10">
                <Car className="h-6 w-6 text-[hsl(var(--spot-occupied))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{occupied}</p>
                <p className="text-sm text-muted-foreground">Occupied</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-[hsl(var(--spot-reserved))]/10">
                <Clock className="h-6 w-6 text-[hsl(var(--spot-reserved))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{reserved}</p>
                <p className="text-sm text-muted-foreground">Reserved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {zones.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {zones.map((z) => (
              <Badge
                key={z.id}
                variant={selectedZone === z.id ? "default" : "outline"}
                className="cursor-pointer text-sm px-4 py-1"
                onClick={() => setSelectedZone(z.id)}
              >
                {z.name}
              </Badge>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {zones.find((z) => z.id === selectedZone)?.name || "All Spots"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSpots.length > 0 ? (
              <ParkingSpotGrid spots={filteredSpots} />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No parking spots configured yet. Ask an admin to add zones and spots.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[hsl(var(--spot-available))]" /> Available
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[hsl(var(--spot-occupied))]" /> Occupied
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[hsl(var(--spot-reserved))]" /> Reserved
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
