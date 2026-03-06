import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ParkingCircle, Car, Shield, Cpu, ArrowRight } from "lucide-react";

const Index = () => {
  const [available, setAvailable] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("parking_spots").select("status");
      if (data) {
        setTotal(data.length);
        setAvailable(data.filter((s) => s.status === "available").length);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-32 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 rounded-full bg-primary/10 px-6 py-3">
              <ParkingCircle className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">SmartPark</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-4">
            Smart Parking<br />Management System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Real-time parking availability, easy reservations, and IoT sensor integration. 
            Find and book your spot in seconds.
          </p>

          {total !== null && (
            <div className="inline-flex items-center gap-4 rounded-2xl bg-card border border-border p-6 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(var(--spot-available))]">{available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{total}</p>
                <p className="text-sm text-muted-foreground">Total Spots</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">Get Started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-0 shadow-none bg-muted/50">
            <CardContent className="p-6 text-center">
              <Car className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">Live spot availability powered by IoT sensors</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-muted/50">
            <CardContent className="p-6 text-center">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Easy Reservations</h3>
              <p className="text-sm text-muted-foreground">Book spots in advance with just a few clicks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-muted/50">
            <CardContent className="p-6 text-center">
              <Cpu className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Arduino Compatible</h3>
              <p className="text-sm text-muted-foreground">Simple REST API for ESP8266/ESP32 sensors</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
