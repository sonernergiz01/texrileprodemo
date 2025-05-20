import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Info, User, Users, Shield, Database, Tag, Bell, Cog } from "lucide-react";

// Navigation items for admin sidebar
const adminNavItems = [
  { 
    href: "/admin/users", 
    label: "Kullanıcı Yönetimi", 
    icon: <Users className="h-4 w-4" /> 
  },
  { 
    href: "/admin/roles", 
    label: "Yetkilendirme", 
    icon: <Shield className="h-4 w-4" /> 
  },
  { 
    href: "/admin/master-data", 
    label: "Ana Veri Yönetimi", 
    icon: <Database className="h-4 w-4" /> 
  },
  { 
    href: "/admin/labels", 
    label: "Etiket Yönetimi", 
    icon: <Tag className="h-4 w-4" /> 
  },
  { 
    href: "/admin/notification-test", 
    label: "Bildirim Testi", 
    icon: <Bell className="h-4 w-4" /> 
  },
  { 
    href: "/admin/operators", 
    label: "Operatör Yönetimi", 
    icon: <User className="h-4 w-4" /> 
  }
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title = "Yönetici Paneli", subtitle }: AdminLayoutProps) => {
  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row w-full">
        {/* Sidebar */}
        <div className="w-full lg:w-64 lg:min-h-screen lg:border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center">
              <Cog className="mr-2 h-5 w-5" />
              Yönetici Paneli
            </h2>
          </div>
          <nav className="p-2">
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground ${
                      window.location.pathname === item.href
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen bg-muted/30">
          {/* Header */}
          <header className="p-4 border-b bg-card">
            <div className="flex flex-col space-y-1.5">
              <h2 className="text-2xl font-bold">{title}</h2>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
          </header>
          
          {/* Content */}
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminLayout;