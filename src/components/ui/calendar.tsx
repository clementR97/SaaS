import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** Grille 7 colonnes pour aligner les jours de la semaine et les dates (react-day-picker v9) */
const grid7 = "grid grid-cols-7 w-full";
const cellCenter = "flex items-center justify-center";

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 sm:p-3 w-full max-w-[min(100%,320px)] sm:max-w-none", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        month: "space-y-2 sm:space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center gap-1 sm:gap-2",
        caption_label: "text-xs sm:text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 touch-manipulation",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 touch-manipulation",
        ),
        month_grid: "w-full border-collapse space-y-0 sm:space-y-1",
        weekdays: grid7,
        weekday: cn("text-muted-foreground rounded-md h-7 sm:h-9 font-normal text-[0.7rem] sm:text-[0.8rem]", cellCenter),
        weeks: "w-full space-y-0",
        week: cn(grid7, "mt-1 sm:mt-2"),
        day: cn(
          "h-7 w-7 sm:h-9 sm:w-9 text-xs sm:text-sm p-0 relative rounded-md min-w-0",
          cellCenter,
          "[&:has([aria-selected].range_end)]:rounded-r-md [&:has([aria-selected].outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        ),
        day_button: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 shrink-0 touch-manipulation min-w-0"),
        range_end: "range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
