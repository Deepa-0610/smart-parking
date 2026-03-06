import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cpu, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const SensorConfig = () => {
  const { toast } = useToast();
  const [spots, setSpots] = useState<Tables<"parking_spots">[]>([]);
  const [zones, setZones] = useState<Tables<"parking_zones">[]>([]);
  const [sensorEdits, setSensorEdits] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const { data: s } = await supabase.from("parking_spots").select("*").order("spot_number");
    const { data: z } = await supabase.from("parking_zones").select("*");
    if (s) setSpots(s);
    if (z) setZones(z);
  };

  useEffect(() => { fetchData(); }, []);

  const saveSensor = async (spotId: string) => {
    const sensorId = sensorEdits[spotId];
    if (sensorId === undefined) return;
    const { error } = await supabase
      .from("parking_spots")
      .update({ sensor_id: sensorId || null })
      .eq("id", spotId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Sensor ID updated" }); fetchData(); setSensorEdits((e) => { const n = { ...e }; delete n[spotId]; return n; }); }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "[YOUR_PROJECT_ID]";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sensor Configuration</h1>
          <p className="text-muted-foreground">Map Arduino sensor IDs to parking spots</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Arduino API Endpoints</CardTitle>
            <CardDescription>Use these endpoints in your Arduino code (ESP8266/ESP32)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm break-all">
              <p className="text-muted-foreground mb-1">Update spot status:</p>
              <p className="text-foreground">POST https://{projectId}.supabase.co/functions/v1/update-spot-status</p>
              <p className="text-muted-foreground mt-2 mb-1">Body:</p>
              <p className="text-foreground">{`{ "sensor_id": "SENSOR-001", "status": "occupied" }`}</p>
            </div>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm break-all">
              <p className="text-muted-foreground mb-1">Get all spot statuses:</p>
              <p className="text-foreground">GET https://{projectId}.supabase.co/functions/v1/get-spot-status</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sensor Mapping</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Sensor ID</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((spot) => (
                  <TableRow key={spot.id}>
                    <TableCell className="font-medium">{spot.spot_number}</TableCell>
                    <TableCell>{zones.find((z) => z.id === spot.zone_id)?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Input
                        className="w-40 font-mono text-xs"
                        value={sensorEdits[spot.id] ?? spot.sensor_id ?? ""}
                        onChange={(e) => setSensorEdits((prev) => ({ ...prev, [spot.id]: e.target.value }))}
                        placeholder="SENSOR-001"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sensorEdits[spot.id] === undefined}
                        onClick={() => saveSensor(spot.id)}
                      >
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SensorConfig;
