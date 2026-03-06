import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingCircle, Car, CalendarCheck, Percent } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, reserved: 0, bookingsToday: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data: spots } = await supabase.from("parking_spots").select("status");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      if (spots) {
        setStats({
          total: spots.length,
          available: spots.filter((s) => s.status === "available").length,
          occupied: spots.filter((s) => s.status === "occupied").length,
          reserved: spots.filter((s) => s.status === "reserved").length,
          bookingsToday: count ?? 0,
        });
      }
    };
    fetch();
  }, []);

  const occupancyRate = stats.total > 0 ? Math.round(((stats.occupied + stats.reserved) / stats.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your parking facility</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-primary/10">
                <ParkingCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Spots</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-[hsl(var(--spot-available))]/10">
                <Car className="h-6 w-6 text-[hsl(var(--spot-available))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.occupied}</p>
                <p className="text-sm text-muted-foreground">Occupied</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full p-3 bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{occupancyRate}%</p>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" /> Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.bookingsToday}</p>
            <p className="text-muted-foreground">Bookings today</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
