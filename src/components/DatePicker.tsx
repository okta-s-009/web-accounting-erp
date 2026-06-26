/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function parseDate(val: string): { year: number; month: number; day: number } {
  const parts = val.split('-');
  const year = parseInt(parts[0]) || new Date().getFullYear();
  const month = (parseInt(parts[1]) || 1) - 1;
  const day = parseInt(parts[2]) || 1;
  return { year, month, day };
}

function formatDateValue(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(val: string): string {
  if (!val) return '';
  const { year, month, day } = parseDate(val);
  return `${day} ${MONTH_NAMES[month]} ${year}`;
}

type ViewMode = 'days' | 'months' | 'years';

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value ? parseDate(value) : { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(parsed.year / 12) * 12);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const p = parseDate(value);
      setViewYear(p.year);
      setViewMonth(p.month);
      setYearRangeStart(Math.floor(p.year / 12) * 12);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position popover above if near bottom of viewport
  const [popoverPosition, setPopoverPosition] = useState<'below' | 'above'>('below');
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPopoverPosition(spaceBelow < 360 ? 'above' : 'below');
    }
  }, [isOpen]);

  const handleSelectDay = useCallback((day: number) => {
    onChange(formatDateValue(viewYear, viewMonth, day));
    setIsOpen(false);
    setViewMode('days');
  }, [viewYear, viewMonth, onChange]);

  const handleSelectMonth = useCallback((month: number) => {
    setViewMonth(month);
    setViewMode('days');
  }, []);

  const handleSelectYear = useCallback((year: number) => {
    setViewYear(year);
    setViewMode('months');
  }, []);

  const navigateMonth = useCallback((direction: number) => {
    let newMonth = viewMonth + direction;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setViewMonth(newMonth);
    setViewYear(newYear);
  }, [viewMonth, viewYear]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day: number) => {
    if (!value) return false;
    const p = parseDate(value);
    return day === p.day && viewMonth === p.month && viewYear === p.year;
  };

  return (
    <div ref={containerRef} className="relative" id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setViewMode('days'); }}
        className={`w-full flex items-center justify-between text-xs px-3 py-2 border border-white/[0.1] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold bg-zinc-900 text-zinc-100 hover:border-zinc-600 transition-colors cursor-pointer ${className || ''}`}
      >
        <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>
          {value ? formatDisplay(value) : 'Pilih tanggal...'}
        </span>
        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-2" />
      </button>

      {/* Popover Calendar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: popoverPosition === 'below' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[100] left-0 right-0 sm:left-auto sm:right-auto sm:w-[280px] bg-zinc-900 border border-white/[0.1] rounded-xl shadow-2xl shadow-black/40 p-3 ${
              popoverPosition === 'below' ? 'mt-1.5 top-full' : 'mb-1.5 bottom-full'
            }`}
          >
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-2.5">
              {viewMode === 'days' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="text-xs font-black text-zinc-100 hover:bg-white/[0.06] px-3 py-1 rounded-lg transition-colors cursor-pointer uppercase tracking-wide"
                  >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {viewMode === 'months' && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewYear(viewYear - 1)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('years')}
                    className="text-xs font-black text-zinc-100 hover:bg-white/[0.06] px-3 py-1 rounded-lg transition-colors cursor-pointer uppercase tracking-wide"
                  >
                    {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewYear(viewYear + 1)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {viewMode === 'years' && (
                <>
                  <button
                    type="button"
                    onClick={() => setYearRangeStart(yearRangeStart - 12)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-zinc-100 uppercase tracking-wide">
                    {yearRangeStart} — {yearRangeStart + 11}
                  </span>
                  <button
                    type="button"
                    onClick={() => setYearRangeStart(yearRangeStart + 12)}
                    className="p-1 hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Days View */}
            {viewMode === 'days' && (
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[9px] font-black text-zinc-500 uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center">
                      {day !== null ? (
                        <button
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          className={`w-full h-full flex items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-100 cursor-pointer ${
                            isSelected(day)
                              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/30'
                              : isToday(day)
                              ? 'bg-zinc-800 text-indigo-400 font-black ring-1 ring-indigo-500/50'
                              : 'text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100'
                          }`}
                        >
                          {day}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Today shortcut */}
                <div className="mt-2.5 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      onChange(formatDateValue(t.getFullYear(), t.getMonth(), t.getDate()));
                      setViewYear(t.getFullYear());
                      setViewMonth(t.getMonth());
                      setIsOpen(false);
                    }}
                    className="w-full text-[10px] font-black text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.06] py-1.5 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Hari Ini — {today.getDate()} {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
                  </button>
                </div>
              </div>
            )}

            {/* Months View */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES.map((name, idx) => {
                  const isCurrentMonth = idx === viewMonth && viewYear === (value ? parseDate(value).year : -1);
                  const isTodayMonth = idx === today.getMonth() && viewYear === today.getFullYear();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`py-2.5 px-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                        isCurrentMonth
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : isTodayMonth
                          ? 'bg-zinc-800 text-indigo-400 ring-1 ring-indigo-500/50'
                          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100'
                      }`}
                    >
                      {name.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Years View */}
            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(year => {
                  const isCurrentYear = value ? parseDate(value).year === year : false;
                  const isTodayYear = today.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleSelectYear(year)}
                      className={`py-2.5 px-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isCurrentYear
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : isTodayYear
                          ? 'bg-zinc-800 text-indigo-400 ring-1 ring-indigo-500/50'
                          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100'
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
