import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, CheckCircle2, Clock, FileText, Filter, Plus, RefreshCcw, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Takvim etkinlik türleri
interface CalendarEvent {
  id: number;
  title: string;
  date: string; // ISO string format
  startTime?: string;
  endTime?: string;
  type: 'plan' | 'deadline' | 'meeting' | 'maintenance';
  status: 'scheduled' | 'completed' | 'cancelled';
  description?: string;
  departmentId?: number;
  departmentName?: string;
  userId?: number;
  userName?: string;
  relatedOrderId?: number;
  relatedOrderCode?: string;
}

// Departmanlar için tür
interface Department {
  id: number;
  name: string;
  code: string;
  color: string;
}

// Event için arkaplan rengi yardımcısı
const getEventColor = (type: string) => {
  switch (type) {
    case 'plan':
      return 'bg-blue-100 border-blue-500 text-blue-700';
    case 'deadline':
      return 'bg-red-100 border-red-500 text-red-700';
    case 'meeting':
      return 'bg-green-100 border-green-500 text-green-700';
    case 'maintenance':
      return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    default:
      return 'bg-gray-100 border-gray-500 text-gray-700';
  }
};

// Event için badge
const getEventBadge = (type: string) => {
  switch (type) {
    case 'plan':
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Üretim Planı</Badge>;
    case 'deadline':
      return <Badge variant="outline" className="bg-red-100 text-red-700">Son Tarih</Badge>;
    case 'meeting':
      return <Badge variant="outline" className="bg-green-100 text-green-700">Toplantı</Badge>;
    case 'maintenance':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Bakım</Badge>;
    default:
      return <Badge variant="outline">Diğer</Badge>;
  }
};

// Status için badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Planlandı</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-100 text-green-700">Tamamlandı</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-700">İptal Edildi</Badge>;
    default:
      return <Badge variant="outline">Beklemede</Badge>;
  }
};

// Belirli bir tarihe ait etkinliklerin filtrelenmesi
const getEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return events.filter(event => {
    const eventDate = event.date.split('T')[0];
    return eventDate === dateString;
  });
};

// Öncelikli günlerin vurgulanması için CSS sınıfı
const getDayClass = (day: Date, events: CalendarEvent[] | null | undefined): string | undefined => {
  if (!events) return undefined;
  const dateString = format(day, 'yyyy-MM-dd');
  const dayEvents = events.filter(event => event.date.split('T')[0] === dateString);
  
  if (dayEvents.length > 0) {
    if (dayEvents.some(event => event.type === 'deadline')) {
      return 'bg-red-50 text-red-900 font-semibold border-red-300 hover:bg-red-100';
    }
    if (dayEvents.some(event => event.type === 'plan')) {
      return 'bg-blue-50 text-blue-900 font-semibold border-blue-300 hover:bg-blue-100';
    }
    if (dayEvents.some(event => event.type === 'meeting')) {
      return 'bg-green-50 text-green-900 font-semibold border-green-300 hover:bg-green-100';
    }
    if (dayEvents.some(event => event.type === 'maintenance')) {
      return 'bg-yellow-50 text-yellow-900 font-semibold border-yellow-300 hover:bg-yellow-100';
    }
  }
  return undefined;
};

const PlanningCalendar: React.FC = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Yeni etkinlik form verileri
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting',
    status: 'scheduled',
    description: '',
    departmentId: undefined,
  });

  // API'den departmanları getir
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments"],
  });

  // API'den takvim etkinliklerini getir
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<CalendarEvent[]>({
    queryKey: [
      "/api/planning/calendar/events", 
      { month: format(selectedMonth, 'yyyy-MM') },
      { department: filterDepartment },
      { type: filterType }
    ],
    // Hata yönetimi
    onError: (error) => {
      console.error("Takvim etkinlikleri yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Takvim etkinlikleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Seçili tarihe ait etkinlikler - null kontrolü ekle
  const selectedDateEvents = events ? getEventsForDate(events, selectedDate) : [];

  // Yeni etkinlik oluşturma
  const handleCreateEvent = () => {
    // Normalde burası API'ye yeni etkinlik eklemek için bir API çağrısı yapacak
    toast({
      title: "Etkinlik oluşturuldu",
      description: `"${newEvent.title}" etkinliği başarıyla oluşturuldu.`,
    });
    
    setShowNewEventDialog(false);
    refetchEvents();

    // Form verilerini sıfırla
    setNewEvent({
      title: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      type: 'meeting',
      status: 'scheduled',
      description: '',
      departmentId: undefined,
    });
  };

  // Etkinlik silme
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    // Normalde burası API'ye etkinlik silmek için bir API çağrısı yapacak
    toast({
      title: "Etkinlik silindi",
      description: `"${selectedEvent.title}" etkinliği başarıyla silindi.`,
      variant: "destructive",
    });
    
    setShowEventDetailsDialog(false);
    setSelectedEvent(null);
    refetchEvents();
  };

  // Etkinlik durumunu güncelleme
  const handleUpdateEventStatus = (status: 'scheduled' | 'completed' | 'cancelled') => {
    if (!selectedEvent) return;

    // Normalde burası API'ye etkinlik güncellemek için bir API çağrısı yapacak
    toast({
      title: "Etkinlik güncellendi",
      description: `"${selectedEvent.title}" etkinliğinin durumu güncellendi.`,
    });
    
    setShowEventDetailsDialog(false);
    setSelectedEvent(null);
    refetchEvents();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planlama Takvimi</h2>
          <p className="text-muted-foreground">
            Üretim planları, toplantılar ve önemli tarihleri görsel takvim üzerinde yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchEvents()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setNewEvent({
                ...newEvent,
                date: format(selectedDate, 'yyyy-MM-dd')
              });
              setShowNewEventDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Etkinlik
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="md:w-3/4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Üretim Takvimi</CardTitle>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtrele
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filtreler</h4>
                        <p className="text-sm text-muted-foreground">
                          Takvim etkinliklerini filtreleyin
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="departmentFilter" className="col-span-4">
                            Departman
                          </Label>
                          <Select
                            value={filterDepartment}
                            onValueChange={setFilterDepartment}
                          >
                            <SelectTrigger className="col-span-4">
                              <SelectValue placeholder="Tüm Departmanlar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tüm Departmanlar</SelectItem>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="typeFilter" className="col-span-4">
                            Etkinlik Türü
                          </Label>
                          <Select
                            value={filterType}
                            onValueChange={setFilterType}
                          >
                            <SelectTrigger className="col-span-4">
                              <SelectValue placeholder="Tüm Etkinlikler" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tüm Etkinlikler</SelectItem>
                              <SelectItem value="plan">Üretim Planları</SelectItem>
                              <SelectItem value="deadline">Son Tarihler</SelectItem>
                              <SelectItem value="meeting">Toplantılar</SelectItem>
                              <SelectItem value="maintenance">Bakım</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={tr}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              modifiers={{
                eventDay: (day) => {
                  return events ? getEventsForDate(events, day).length > 0 : false;
                }
              }}
              modifiersClassNames={{
                eventDay: "bg-blue-50 font-semibold text-blue-900"
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const dayClass = getDayClass(date, events);
                  return (
                    <div
                      className={`relative ${dayClass}`}
                      {...props}
                    >
                      {date.getDate()}
                      {events && getEventsForDate(events, date).length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                          <div className="flex gap-0.5">
                            {getEventsForDate(events, date).slice(0, 3).map((_, i) => (
                              <div key={i} className="h-1 w-1 rounded-full bg-blue-500" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="md:w-1/4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</span>
              <Badge variant="outline" className="text-xs">
                {selectedDateEvents.length} etkinlik
              </Badge>
            </CardTitle>
            <CardDescription>
              Seçili tarih için planlanan etkinlikler ve işler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <Card
                      key={event.id}
                      className={`${getEventColor(event.type)} border cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDetailsDialog(true);
                      }}
                    >
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        {event.departmentName && (
                          <div className="flex items-center text-sm mt-1">
                            <User className="h-3 w-3 mr-1" />
                            <span>{event.departmentName}</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          {getEventBadge(event.type)}
                          {getStatusBadge(event.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Etkinlik bulunamadı</AlertTitle>
                <AlertDescription>
                  Bu tarih için planlanan etkinlik bulunmuyor.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                setNewEvent({
                  ...newEvent,
                  date: format(selectedDate, 'yyyy-MM-dd')
                });
                setShowNewEventDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Etkinlik Ekle
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Yeni Etkinlik Dialog */}
      <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yeni Etkinlik Oluştur</DialogTitle>
            <DialogDescription>
              {format(selectedDate, 'd MMMM yyyy', { locale: tr })} tarihine yeni bir etkinlik ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventTitle" className="text-right">
                Başlık
              </Label>
              <Input
                id="eventTitle"
                className="col-span-3"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventType" className="text-right">
                Tür
              </Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent({ ...newEvent, type: value as any })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Etkinlik Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Üretim Planı</SelectItem>
                  <SelectItem value="deadline">Son Tarih</SelectItem>
                  <SelectItem value="meeting">Toplantı</SelectItem>
                  <SelectItem value="maintenance">Bakım</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventDepartment" className="text-right">
                Departman
              </Label>
              <Select
                value={newEvent.departmentId?.toString()}
                onValueChange={(value) => setNewEvent({ ...newEvent, departmentId: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Departman Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Başlangıç
              </Label>
              <Input
                id="startTime"
                type="time"
                className="col-span-3"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                Bitiş
              </Label>
              <Input
                id="endTime"
                type="time"
                className="col-span-3"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventDescription" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="eventDescription"
                className="col-span-3"
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewEventDialog(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              onClick={handleCreateEvent}
              disabled={!newEvent.title}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Etkinlik Detayı Dialog */}
      <Dialog open={showEventDetailsDialog} onOpenChange={setShowEventDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                  <div className="flex gap-2">
                    {getEventBadge(selectedEvent.type)}
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>
                <DialogDescription>
                  {format(new Date(selectedEvent.date), 'd MMMM yyyy', { locale: tr })}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </span>
                  </div>
                  
                  {selectedEvent.departmentName && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>{selectedEvent.departmentName}</span>
                    </div>
                  )}
                  
                  {selectedEvent.description && (
                    <>
                      <Separator />
                      <div>
                        <Label>Açıklama</Label>
                        <p className="mt-1 text-sm">{selectedEvent.description}</p>
                      </div>
                    </>
                  )}
                  
                  {selectedEvent.relatedOrderCode && (
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Sipariş: {selectedEvent.relatedOrderCode}</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2 sm:flex-1">
                  {selectedEvent.status !== 'completed' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpdateEventStatus('completed')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Tamamla
                    </Button>
                  )}
                  
                  {selectedEvent.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateEventStatus('cancelled')}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      İptal Et
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteEvent}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningCalendar;