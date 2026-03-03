import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Quote } from '@/types/quote';

interface OrdersCalendarProps {
  quotes: Quote[];
  onSelectQuote: (quote: Quote) => void;
  onDayClick?: (dateKey: string, quotes: Quote[]) => void;
}

export function OrdersCalendar({ quotes, onSelectQuote, onDayClick }: OrdersCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Quote[]>();
    quotes.forEach((q) => {
      if (q.eventDate) {
        const key = q.eventDate;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(q);
      }
    });
    return map;
  }, [quotes]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getStatusColor = (dayQuotes: Quote[]) => {
    // Priority: delivered > approved > pending
    if (dayQuotes.some(q => q.status === 'delivered')) return 'bg-blue-600 text-white';
    if (dayQuotes.some(q => q.status === 'approved')) return 'bg-green-600 text-white';
    return 'bg-yellow-500 text-white';
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-display font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayQuotes = eventsByDate.get(dateKey) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const hasEvents = dayQuotes.length > 0;

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!hasEvents}
                onClick={() => {
                  if (hasEvents && onDayClick) {
                    onDayClick(dateKey, dayQuotes);
                  }
                }}
                className={`aspect-square rounded-md flex items-center justify-center text-sm font-semibold transition-colors
                  ${!inMonth ? 'opacity-30' : ''}
                  ${hasEvents
                    ? `${getStatusColor(dayQuotes)} shadow-sm cursor-pointer hover:opacity-90`
                    : 'text-foreground'
                  }
                  ${today && !hasEvents ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
