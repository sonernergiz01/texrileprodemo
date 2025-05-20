import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, BrainCircuit, Calendar, GanttChart } from "lucide-react";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Kapasiteler türleri
interface DepartmentCapacity {
  id: number;
  departmentId: number;
  departmentName: string;
  startDate: string;
  endDate: string;
  capacityHours: number;
  plannedHours: number;
  currentUtilization: number;
  status: string; // "optimal" | "critical" | "overload"
}

interface MachineCapacity {
  id: number;
  machineId: number;
  machineName: string;
  departmentId: number;
  departmentName: string;
  startDate: string;
  endDate: string;
  capacityHours: number;
  plannedHours: number;
  currentUtilization: number;
  status: string; // "optimal" | "critical" | "overload"
}

// Renk yardımcı fonksiyonu
const getUtilizationColorClass = (utilization: number) => {
  if (utilization < 70) return "text-green-500";
  if (utilization < 90) return "text-yellow-500";
  return "text-red-500";
};

const getUtilizationProgressClass = (utilization: number) => {
  if (utilization < 70) return "bg-green-500";
  if (utilization < 90) return "bg-yellow-500";
  return "bg-red-500";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "optimal":
      return <Badge className="bg-green-500">Optimal</Badge>;
    case "critical":
      return <Badge className="bg-yellow-500">Kritik</Badge>;
    case "overload":
      return <Badge className="bg-red-500">Aşırı Yüklü</Badge>;
    default:
      return <Badge className="bg-blue-500">{status}</Badge>;
  }
};

const CapacityPlanning: React.FC = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(new Date().setDate(new Date().getDate() + 60)),
  });
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<string>("departments");

  // Departman listesini getir
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/departments"],
    onError: (error) => {
      console.error("Departman listesi yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Departman listesi yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Departman kapasitelerini getir
  const { data: departmentCapacities = [], isLoading: isDepartmentsLoading } = useQuery<DepartmentCapacity[]>({
    queryKey: ["/api/planning/capacity/departments", date, selectedDepartment],
    enabled: !!date.from && !!date.to,
  });

  // Makine kapasitelerini getir
  const { data: machineCapacities = [], isLoading: isMachinesLoading } = useQuery<MachineCapacity[]>({
    queryKey: ["/api/planning/capacity/machines", date, selectedDepartment],
    enabled: !!date.from && !!date.to && selectedTab === "machines",
  });

  // Departman grafiği için veri
  const departmentChartData = departmentCapacities && departmentCapacities.length > 0 ? departmentCapacities.map(dept => ({
    name: dept.departmentName,
    kapasite: dept.capacityHours,
    planlanan: dept.plannedHours,
    kullanım: Math.round(dept.currentUtilization)
  })) : [];

  // Makine grafiği için veri
  const machineChartData = machineCapacities && machineCapacities.length > 0 ? machineCapacities.map(machine => ({
    name: machine.machineName,
    kapasite: machine.capacityHours,
    planlanan: machine.plannedHours,
    kullanım: Math.round(machine.currentUtilization)
  })) : [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kapasite Planlama</h2>
          <p className="text-muted-foreground">
            Departman ve makine kapasitelerini analiz edin ve optimize edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* <CalendarDateRangePicker date={date} setDate={setDate} /> */}
          <div>
            <Button size="sm" className="ml-auto" variant="outline">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Otomatik Optimizasyon
            </Button>
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="departments" 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="departments">
              <Calendar className="mr-2 h-4 w-4" />
              Departmanlar
            </TabsTrigger>
            <TabsTrigger value="machines">
              <GanttChart className="mr-2 h-4 w-4" />
              Makineler
            </TabsTrigger>
          </TabsList>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tüm Departmanlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Departmanlar</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Kapasite (Saat)
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {departmentCapacities.reduce((sum, dept) => sum + dept.capacityHours, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seçili tarih aralığında tüm departmanların toplam kapasitesi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Planlanan İş Yükü (Saat)
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {departmentCapacities.reduce((sum, dept) => sum + dept.plannedHours, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seçili tarih aralığında tüm departmanların toplam planlanmış iş yükü
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ortalama Kapasite Kullanımı
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {departmentCapacities.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        departmentCapacities.reduce((sum, dept) => sum + dept.currentUtilization, 0) / departmentCapacities.length
                      )}%
                    </div>
                    <Progress 
                      value={Math.round(
                        departmentCapacities.reduce((sum, dept) => sum + dept.currentUtilization, 0) / departmentCapacities.length
                      )} 
                      className="h-2" 
                    />
                  </>
                ) : (
                  <div className="text-2xl font-bold">0%</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Tüm departmanların ortalama kapasite kullanım oranı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kritik Departmanlar
                </CardTitle>
                <AlertTitle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {departmentCapacities.filter(dept => dept.currentUtilization >= 90).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kapasite kullanımı %90'ın üzerinde olan departmanlar
                </p>
              </CardContent>
            </Card>
          </div>

          {departmentCapacities.length > 0 ? (
            <>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Departman Kapasite Analizi</CardTitle>
                  <CardDescription>
                    Departmanların kapasite ve planlanan iş yükü karşılaştırması
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={departmentChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="kapasite" fill="#8884d8" name="Kapasite (Saat)" />
                        <Bar dataKey="planlanan" fill="#82ca9d" name="Planlanan (Saat)" />
                        <Bar dataKey="kullanım" fill="#ffc658" name="Kullanım (%)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Departman Kapasite Detayları</CardTitle>
                    <CardDescription>
                      Departman bazında kapasite kullanım oranları ve durumları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departmentCapacities.map(dept => (
                        <div key={dept.id} className="grid grid-cols-6 items-center gap-4 border-b pb-4">
                          <div className="col-span-2">
                            <div className="font-medium">{dept.departmentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(dept.startDate).toLocaleDateString()} - {new Date(dept.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex w-full items-center gap-2">
                              <div className="font-medium">{dept.plannedHours} / {dept.capacityHours} saat</div>
                            </div>
                            <Progress 
                              value={dept.currentUtilization} 
                              className={`h-2 ${getUtilizationProgressClass(dept.currentUtilization)}`} 
                            />
                          </div>
                          <div className={`text-right font-bold ${getUtilizationColorClass(dept.currentUtilization)}`}>
                            {dept.currentUtilization}%
                          </div>
                          <div className="text-right">
                            {getStatusBadge(dept.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : isDepartmentsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  <div>Departman kapasiteleri yükleniyor...</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTitle>Veri bulunamadı</AlertTitle>
              <AlertDescription>
                Seçili tarih aralığında ve filtrelerde departman kapasite verisi bulunamadı.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Makine Kapasitesi (Saat)
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {machineCapacities.reduce((sum, machine) => sum + machine.capacityHours, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seçili tarih aralığında tüm makinelerin toplam kapasitesi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Planlanan Makine İş Yükü (Saat)
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {machineCapacities.reduce((sum, machine) => sum + machine.plannedHours, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seçili tarih aralığında tüm makinelerin toplam planlanmış iş yükü
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ortalama Makine Kullanımı
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {machineCapacities.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        machineCapacities.reduce((sum, machine) => sum + machine.currentUtilization, 0) / machineCapacities.length
                      )}%
                    </div>
                    <Progress 
                      value={Math.round(
                        machineCapacities.reduce((sum, machine) => sum + machine.currentUtilization, 0) / machineCapacities.length
                      )} 
                      className="h-2" 
                    />
                  </>
                ) : (
                  <div className="text-2xl font-bold">0%</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Tüm makinelerin ortalama kapasite kullanım oranı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Kritik Makineler
                </CardTitle>
                <AlertTitle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {machineCapacities.filter(machine => machine.currentUtilization >= 90).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kapasite kullanımı %90'ın üzerinde olan makineler
                </p>
              </CardContent>
            </Card>
          </div>

          {machineCapacities.length > 0 ? (
            <>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Makine Kapasite Analizi</CardTitle>
                  <CardDescription>
                    Makinelerin kapasite ve planlanan iş yükü karşılaştırması
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={machineChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="kapasite" fill="#8884d8" name="Kapasite (Saat)" />
                        <Bar dataKey="planlanan" fill="#82ca9d" name="Planlanan (Saat)" />
                        <Bar dataKey="kullanım" fill="#ffc658" name="Kullanım (%)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Makine Kapasite Detayları</CardTitle>
                    <CardDescription>
                      Makine bazında kapasite kullanım oranları ve durumları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {machineCapacities.map(machine => (
                        <div key={machine.id} className="grid grid-cols-7 items-center gap-4 border-b pb-4">
                          <div className="col-span-2">
                            <div className="font-medium">{machine.machineName}</div>
                            <div className="text-xs text-muted-foreground">
                              {machine.departmentName}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="text-xs text-muted-foreground">
                              {new Date(machine.startDate).toLocaleDateString()} - {new Date(machine.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="flex w-full items-center gap-2">
                              <div className="font-medium">{machine.plannedHours} / {machine.capacityHours} saat</div>
                            </div>
                            <Progress 
                              value={machine.currentUtilization} 
                              className={`h-2 ${getUtilizationProgressClass(machine.currentUtilization)}`} 
                            />
                          </div>
                          <div className={`text-right font-bold ${getUtilizationColorClass(machine.currentUtilization)}`}>
                            {machine.currentUtilization}%
                          </div>
                          <div className="text-right">
                            {getStatusBadge(machine.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : isMachinesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  <div>Makine kapasiteleri yükleniyor...</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTitle>Veri bulunamadı</AlertTitle>
              <AlertDescription>
                Seçili tarih aralığında ve filtrelerde makine kapasite verisi bulunamadı.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CapacityPlanning;