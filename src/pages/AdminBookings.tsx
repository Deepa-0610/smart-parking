import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AdminBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: "active" | "completed" | "cancelled";
  user_id: string;
  parking_spots: { spot_number: string; parking_zones: { name: string } | null } | null;
}

const statusBadge: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, start_time, end_time, status, user_id, parking_spots(spot_number, parking_zones(name))")
        .order("created_at", { ascending: false });
      if (data) setBookings(data as unknown as AdminBooking[]);
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Bookings</h1>
          <p className="text-muted-foreground">View all parking reservations</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.parking_spots?.spot_number ?? "-"}</TableCell>
                    <TableCell>{b.parking_spots?.parking_zones?.name ?? "-"}</TableCell>
                    <TableCell>{format(new Date(b.start_time), "MMM d, h:mm a")}</TableCell>
                    <TableCell>{format(new Date(b.end_time), "MMM d, h:mm a")}</TableCell>
                    <TableCell><Badge variant={statusBadge[b.status]}>{b.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bookings yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminBookings;
