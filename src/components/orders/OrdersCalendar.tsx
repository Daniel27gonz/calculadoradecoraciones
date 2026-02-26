import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

export function OrdersCalendar({ quotes, onSelectQuote }: OrdersCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Quote[]>();
    quotes.forEach((q) => {
      if (q.eventDate) {
        const key = q.eventDate; // ISO date string YYYY-MM-DD
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

            return (
              <div
                key={dateKey}
                className={`min-h-[3rem] md:min-h-[4rem] rounded-md p-1 text-xs transition-colors
                  ${inMonth ? 'bg-muted/30' : 'opacity-30'}
                  ${today ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                `}
              >
                <span className={`block text-center font-medium mb-0.5 ${today ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5 overflow-hidden">
                  {dayQuotes.slice(0, 2).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => onSelectQuote(q)}
                      className={`w-full text-left truncate rounded px-1 py-0.5 text-[10px] leading-tight font-medium transition-colors
                        ${q.status === 'delivered'
                          ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30'
                          : q.status === 'approved'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30'
                        }
                      `}
                      title={`${q.clientName} - ${q.eventType || 'Evento'}${q.setupTime ? ` - ${q.setupTime}` : ''}`}
                    >
                      {q.setupTime ? `${q.setupTime} ` : ''}{q.clientName}
                    </button>
                  ))}
                  {dayQuotes.length > 2 && (
                    <span className="block text-center text-[10px] text-muted-foreground">
                      +{dayQuotes.length - 2} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
