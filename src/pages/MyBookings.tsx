import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BookingWithSpot {
  id: string;
  start_time: string;
  end_time: string;
  status: "active" | "completed" | "cancelled";
  parking_spots: { spot_number: string; parking_zones: { name: string } | null } | null;
}

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const MyBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithSpot[]>([]);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, status, parking_spots(spot_number, parking_zones(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBookings(data as unknown as BookingWithSpot[]);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const cancelBooking = async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" as const })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled" });
      fetchBookings();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your parking reservations</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No bookings yet. Go to "Book a Spot" to reserve parking.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        Spot {b.parking_spots?.spot_number ?? "N/A"}
                      </span>
                      <Badge variant={statusBadge[b.status]}>{b.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {b.parking_spots?.parking_zones?.name ?? "Unknown Zone"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(b.start_time), "MMM d, h:mm a")} → {format(new Date(b.end_time), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {b.status === "active" && (
                    <Button variant="destructive" size="sm" onClick={() => cancelBooking(b.id)}>
                      Cancel
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyBookings;
