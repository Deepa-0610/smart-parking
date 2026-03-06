import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ParkingCircle,
  LayoutDashboard,
  CalendarCheck,
  History,
  Settings,
  Users,
  Cpu,
  LogOut,
  Car,
} from "lucide-react";

const AppSidebar = () => {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const driverItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Book a Spot", url: "/book", icon: CalendarCheck },
    { title: "My Bookings", url: "/bookings", icon: History },
  ];

  const adminItems = [
    { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Manage Spots", url: "/admin/spots", icon: ParkingCircle },
    { title: "All Bookings", url: "/admin/bookings", icon: CalendarCheck },
    { title: "Sensor Config", url: "/admin/sensors", icon: Cpu },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <ParkingCircle className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">SmartPark</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Driver</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {driverItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70 mb-2">
          <Car className="h-4 w-4" />
          <span className="truncate">{user?.email}</span>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
