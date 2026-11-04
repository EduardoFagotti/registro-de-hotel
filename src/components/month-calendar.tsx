"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Calendário em blocos por mês, organizado por semanas (dom–sáb): cada dia
 * mostra o número no canto e a quantidade no centro, com a cor mais forte
 * conforme o movimento. Mostra quantos meses couberem na largura disponível.
 * Usado nas reservas (quartos ocupados por noite).
 */

export interface CalendarDay {
  date: Date;
  count: number;
  /** Dia sem ação (ex.: futuro no histórico do dashboard). */
  future: boolean;
  isToday: boolean;
}

export interface CalendarMonth {
  /** Dia 1 do mês. */
  first: Date;
  days: CalendarDay[];
  total: number;
}

const DAYS_PER_ROW = 7; // uma linha por semana, de domingo a sábado
const MAX_ROWS = 6; // um mês ocupa no máximo 6 semanas
const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MIN_CELL = 34; // px mínimos por quadradinho (dia + quantidade legíveis)
const MAX_CELL = 46; // não deixa o quadradinho inflar quando sobra espaço
const GAP = 4;
const MONTH_GAP = 28; // respiro entre um mês e outro (cabe a moldura dos dois lados)
const FRAME_PAD = 10; // quanto a moldura de cada mês avança além dos dias
const MAX_MONTHS = 6;
const COMPACT_BELOW = 40; // abaixo disso, a quantidade vai para o canto inferior direito

const levelClass = {
  0: "bg-muted text-muted-foreground",
  1: "bg-primary/20 text-foreground",
  2: "bg-primary/45 text-foreground",
  3: "bg-primary/75 text-primary-foreground",
  4: "bg-primary text-primary-foreground",
} as const;

const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Intensidade 0–4 do quadradinho, relativa ao dia de maior movimento. */
export function calendarLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (max <= 4) return Math.min(count, 4) as 1 | 2 | 3 | 4;
  return Math.max(1, Math.ceil((count / max) * 4)) as 1 | 2 | 3 | 4;
}

/** Largura mínima de `count` meses com quadradinhos no tamanho mínimo. */
function minWidth(count: number): number {
  return count * DAYS_PER_ROW * (MIN_CELL + GAP) + (count - 1) * MONTH_GAP + 2 * FRAME_PAD;
}

interface MonthCalendarProps {
  /** Monta os meses exibidos, dado quantos cabem na largura. */
  buildMonths: (count: number) => CalendarMonth[];
  onSelect: (date: Date) => void;
  /** Texto da quantidade (ex.: "3 aplicações"). */
  unit: (count: number) => string;
  /** Complemento do rótulo acessível de cada dia (ex.: "Ver aplicações do dia"). */
  selectHint: string;
  caption: string;
  /** Texto do rodapé com o total (padrão: `unit(total)` nos meses exibidos). */
  summary?: (total: number, monthCount: number) => string;
}

export function MonthCalendar({ buildMonths, onSelect, unit, selectHint, caption, summary }: MonthCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mostra o máximo de meses que cabem no card (sem rolagem), no mínimo um.
  const monthCount = useMemo(() => {
    let n = MAX_MONTHS;
    while (n > 1 && minWidth(n) > width) n--;
    return n;
  }, [width]);

  const months = useMemo(() => buildMonths(monthCount), [buildMonths, monthCount]);
  // Largura real de cada quadradinho com os meses exibidos.
  const cellSize = Math.min(
    monthCount === 1 ? Infinity : MAX_CELL,
    (width - 2 * FRAME_PAD - (monthCount - 1) * MONTH_GAP) / (monthCount * DAYS_PER_ROW) - GAP,
  );
  const compact = cellSize < COMPACT_BELOW;

  const days = months.flatMap((m) => m.days).filter((d) => !d.future);
  const max = Math.max(0, ...days.map((d) => d.count));
  const total = months.reduce((sum, m) => sum + m.total, 0);

  // Uma grade só: 7 colunas (dias da semana) por mês e um respiro entre meses.
  const columns: string[] = [];
  const monthStart: number[] = []; // coluna (1-based) da primeira coluna de cada mês
  months.forEach((_, i) => {
    if (i > 0) columns.push(`${MONTH_GAP - GAP}px`);
    monthStart.push(columns.length + 1);
    // Um mês só (celular): os quadradinhos crescem até preencher a largura toda.
    const maxCell = months.length === 1 ? "1fr" : `${MAX_CELL}px`;
    for (let c = 0; c < DAYS_PER_ROW; c++) columns.push(`minmax(${MIN_CELL}px, ${maxCell})`);
  });
  const lastColumn = columns.length;

  return (
    <div ref={containerRef}>
      <div
        className="grid"
        style={{ gap: GAP, padding: FRAME_PAD, gridTemplateColumns: columns.join(" ") }}
      >
        {/* Moldura de cada mês: atrás do nome e dos dias, avançando FRAME_PAD para fora */}
        {months.map((m, i) => (
          <div
            key={`frame-${m.first.toISOString()}`}
            aria-hidden="true"
            className="pointer-events-none rounded-xl border bg-muted/30"
            style={{
              gridRow: `1 / span ${MAX_ROWS + 2}`,
              gridColumn: `${monthStart[i]} / span ${DAYS_PER_ROW}`,
              margin: -FRAME_PAD,
            }}
          />
        ))}

        {/* Nomes dos meses */}
        {months.map((m, i) => (
          <div
            key={`label-${m.first.toISOString()}`}
            className="mb-1 flex items-baseline justify-between gap-2 pb-1"
            style={{ gridRow: 1, gridColumn: `${monthStart[i]} / span ${DAYS_PER_ROW}` }}
          >
            <span className="text-sm font-medium first-letter:uppercase">
              {monthYear.format(m.first)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{m.total}</span>
          </div>
        ))}

        {/* Iniciais dos dias da semana, em cada mês */}
        {months.map((m, i) =>
          WEEKDAY_INITIALS.map((initial, d) => (
            <div
              key={`wd-${m.first.toISOString()}-${d}`}
              aria-hidden="true"
              className="text-center text-xs font-medium text-muted-foreground"
              style={{ gridRow: 2, gridColumn: monthStart[i] + d }}
            >
              {initial}
            </div>
          )),
        )}

        {/* Dias: cada linha é uma semana; o dia 1 cai na coluna do seu dia da semana */}
        {months.map((m, i) =>
          m.days.map((day, index) => {
            const slot = m.first.getDay() + index;
            const row = Math.floor(slot / DAYS_PER_ROW);
            const column = monthStart[i] + (slot % DAYS_PER_ROW);
            const placement = { gridRow: row + 3, gridColumn: column };

            if (day.future) {
              return (
                <div
                  key={day.date.toISOString()}
                  style={placement}
                  className="relative aspect-square rounded-[4px] border border-border/60"
                >
                  <span className="absolute top-0.5 left-1 text-[11px] leading-none text-muted-foreground/50 tabular-nums">
                    {day.date.getDate()}
                  </span>
                </div>
              );
            }

            const level = calendarLevel(day.count, max);
            return (
              <button
                type="button"
                key={day.date.toISOString()}
                style={placement}
                onClick={() => onSelect(day.date)}
                aria-label={`${fullDate.format(day.date)}: ${unit(day.count)}. ${selectHint}`}
                className={cn(
                  "group relative flex aspect-square cursor-pointer items-center justify-center rounded-[4px] outline-none",
                  levelClass[level],
                  day.isToday && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-card",
                  "hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {/* O número do dia fica sempre no canto superior esquerdo */}
                <span
                  className={cn(
                    "absolute top-0.5 left-1 leading-none opacity-70 tabular-nums",
                    compact ? "text-[10px]" : "text-[11px]",
                  )}
                >
                  {day.date.getDate()}
                </span>
                {day.count > 0 &&
                  (compact ? (
                    // Pouco espaço: a quantidade vai para o canto inferior direito, sem cobrir o dia.
                    <span className="absolute right-1 bottom-0.5 text-[13px] leading-none font-semibold tabular-nums">
                      {day.count}
                    </span>
                  ) : (
                    <span className="mt-2 text-sm font-semibold tabular-nums">{day.count}</span>
                  ))}

                {/* display:none até o hover, para não ocupar espaço */}
                <div
                  className={cn(
                    "pointer-events-none absolute z-10 hidden rounded-md border bg-popover px-2 py-1 text-center whitespace-nowrap text-popover-foreground shadow-sm group-hover:block group-focus-visible:block",
                    row < 2 ? "top-full mt-1" : "bottom-full mb-1",
                    column < 4 ? "left-0" : column > lastColumn - 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <div className="text-sm font-semibold">{unit(day.count)}</div>
                  <div className="text-[11px] text-muted-foreground first-letter:uppercase">
                    {fullDate.format(day.date)}
                  </div>
                </div>
              </button>
            );
          }),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {summary
            ? summary(total, monthCount)
            : `${unit(total)} ${monthCount === 1 ? "no mês" : `nos ${monthCount} meses exibidos`}`}
        </span>
        <span className="flex items-center gap-1">
          Menos
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className={cn("size-3 rounded-[3px]", levelClass[level])} />
          ))}
          Mais
        </span>
      </div>

      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <tbody>
            {days
              .filter((d) => d.count > 0)
              .map((d) => (
                <tr key={d.date.toISOString()}>
                  <td>{fullDate.format(d.date)}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
