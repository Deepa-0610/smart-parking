import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import ParkingSpotGrid from "@/components/ParkingSpotGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const BookSpot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [zones, setZones] = useState<Tables<"parking_zones">[]>([]);
  const [spots, setSpots] = useState<Tables<"parking_spots">[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Tables<"parking_spots"> | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: z } = await supabase.from("parking_zones").select("*");
      const { data: s } = await supabase.from("parking_spots").select("*");
      if (z) { setZones(z); if (z.length && !selectedZone) setSelectedZone(z[0].id); }
      if (s) setSpots(s);
    };
    fetchData();
  }, []);

  const filteredSpots = (selectedZone ? spots.filter((s) => s.zone_id === selectedZone) : spots)
    .filter((s) => s.status === "available");

  const handleBook = async () => {
    if (!selectedSpot || !startTime || !endTime || !user) return;
    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      spot_id: selectedSpot.id,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
    });
    if (error) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking confirmed!", description: `Spot ${selectedSpot.spot_number} reserved.` });
      setSelectedSpot(null);
      setStartTime("");
      setEndTime("");
      // Refresh spots
      const { data: s } = await supabase.from("parking_spots").select("*");
      if (s) setSpots(s);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Book a Spot</h1>
          <p className="text-muted-foreground">Select an available spot and choose your time</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {zones.map((z) => (
            <Badge
              key={z.id}
              variant={selectedZone === z.id ? "default" : "outline"}
              className="cursor-pointer px-4 py-1"
              onClick={() => setSelectedZone(z.id)}
            >
              {z.name}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select a Spot</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSpots.length > 0 ? (
                  <ParkingSpotGrid
                    spots={filteredSpots}
                    onSpotClick={setSelectedSpot}
                    selectedSpotId={selectedSpot?.id}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No spots available in this zone.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSpot ? (
                <>
                  <div className="rounded-lg bg-primary/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Selected Spot</p>
                    <p className="text-2xl font-bold text-primary">{selectedSpot.spot_number}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Time</Label>
                    <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Time</Label>
                    <Input id="end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleBook} disabled={loading || !startTime || !endTime}>
                    {loading ? "Booking..." : "Confirm Booking"}
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">Click an available (green) spot to select it</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default BookSpot;
