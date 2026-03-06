import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const ManageSpots = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<Tables<"parking_zones">[]>([]);
  const [spots, setSpots] = useState<Tables<"parking_spots">[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneLocation, setNewZoneLocation] = useState("");
  const [newSpotNumber, setNewSpotNumber] = useState("");
  const [newSpotZone, setNewSpotZone] = useState("");
  const [newSpotSensor, setNewSpotSensor] = useState("");
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);

  const fetchData = async () => {
    const { data: z } = await supabase.from("parking_zones").select("*").order("name");
    const { data: s } = await supabase.from("parking_spots").select("*").order("spot_number");
    if (z) setZones(z);
    if (s) setSpots(s);
  };

  useEffect(() => { fetchData(); }, []);

  const addZone = async () => {
    if (!newZoneName.trim()) return;
    const { error } = await supabase.from("parking_zones").insert({ name: newZoneName, location: newZoneLocation || null });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Zone added" }); setNewZoneName(""); setNewZoneLocation(""); setZoneDialogOpen(false); fetchData(); }
  };

  const addSpot = async () => {
    if (!newSpotNumber.trim() || !newSpotZone) return;
    const { error } = await supabase.from("parking_spots").insert({
      spot_number: newSpotNumber,
      zone_id: newSpotZone,
      sensor_id: newSpotSensor || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Spot added" });
      setNewSpotNumber(""); setNewSpotSensor(""); setSpotDialogOpen(false);
      // Update zone total_spots
      const zoneSpots = spots.filter((s) => s.zone_id === newSpotZone).length + 1;
      await supabase.from("parking_zones").update({ total_spots: zoneSpots }).eq("id", newSpotZone);
      fetchData();
    }
  };

  const deleteSpot = async (id: string) => {
    const { error } = await supabase.from("parking_spots").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Spot deleted" }); fetchData(); }
  };

  const updateSpotStatus = async (id: string, status: "available" | "occupied" | "reserved") => {
    const { error } = await supabase.from("parking_spots").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
    available: "default",
    occupied: "destructive",
    reserved: "secondary",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Spots</h1>
            <p className="text-muted-foreground">Add zones, spots, and override status</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Zone</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Zone</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zone Name</Label>
                    <Input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="e.g. Zone A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Location (optional)</Label>
                    <Input value={newZoneLocation} onChange={(e) => setNewZoneLocation(e.target.value)} placeholder="e.g. Ground Floor" />
                  </div>
                  <Button onClick={addZone} className="w-full">Add Zone</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={spotDialogOpen} onOpenChange={setSpotDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Spot</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Spot</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Select value={newSpotZone} onValueChange={setNewSpotZone}>
                      <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Spot Number</Label>
                    <Input value={newSpotNumber} onChange={(e) => setNewSpotNumber(e.target.value)} placeholder="e.g. A-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sensor ID (optional)</Label>
                    <Input value={newSpotSensor} onChange={(e) => setNewSpotSensor(e.target.value)} placeholder="e.g. SENSOR-001" />
                  </div>
                  <Button onClick={addSpot} className="w-full">Add Spot</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Parking Spots</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Sensor ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((spot) => (
                  <TableRow key={spot.id}>
                    <TableCell className="font-medium">{spot.spot_number}</TableCell>
                    <TableCell>{zones.find((z) => z.id === spot.zone_id)?.name ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{spot.sensor_id ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[spot.status]}>{spot.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Select value={spot.status} onValueChange={(v) => updateSpotStatus(spot.id, v as any)}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSpot(spot.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {spots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No spots yet. Add a zone first, then add spots.
                    </TableCell>
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

export default ManageSpots;
