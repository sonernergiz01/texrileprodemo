import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { tr } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarDateRangePickerProps {
  className?: string
  date: DateRange
  onChange: (date: DateRange) => void
}

export function CalendarDateRangePicker({
  className,
  date,
  onChange,
}: CalendarDateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "P", { locale: tr })} -{" "}
                  {format(date.to, "P", { locale: tr })}
                </>
              ) : (
                format(date.from, "P", { locale: tr })
              )
            ) : (
              <span>Tarih seçin</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            locale={tr}
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              onChange(newDate as DateRange)
              // Close popover on selection if both dates are chosen
              if (newDate?.from && newDate?.to) {
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
            weekStartsOn={1} // Monday
          />
          <div className="flex justify-end p-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                const today = new Date()
                onChange({
                  from: addDays(today, -30),
                  to: today
                })
                setIsOpen(false)
              }}
            >
              Son 30 Gün
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                const today = new Date()
                onChange({
                  from: addDays(today, -90),
                  to: today
                })
                setIsOpen(false)
              }}
            >
              Son 90 Gün
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                const today = new Date()
                onChange({
                  from: addDays(today, -30),
                  to: addDays(today, 60)
                })
                setIsOpen(false)
              }}
            >
              Gelecek 60 Gün
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}