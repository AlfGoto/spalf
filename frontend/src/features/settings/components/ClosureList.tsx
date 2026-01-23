"use client";

import { Button } from "@/package/ui/button";
import type { Closure } from "@/shared/types";
import { formatDate } from "@/shared/utils";

interface ClosureListProps {
  closures: Closure[];
  onDelete: (closure: Closure) => void;
  isLoading?: boolean;
}

export function ClosureList({
  closures,
  onDelete,
  isLoading,
}: ClosureListProps) {
  if (closures.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p>No closures scheduled.</p>
      </div>
    );
  }

  // Filter to show only future closures first, then past
  const now = new Date().toISOString().split("T")[0];
  const futureClosures = closures.filter((c) => c.date >= now);
  const pastClosures = closures.filter((c) => c.date < now);

  return (
    <div className="space-y-2">
      {futureClosures.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Upcoming Closures
          </p>
          {futureClosures.map((closure) => (
            <ClosureItem
              key={closure.closureId}
              closure={closure}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {pastClosures.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Past Closures
          </p>
          {pastClosures.map((closure) => (
            <ClosureItem
              key={closure.closureId}
              closure={closure}
              onDelete={onDelete}
              isLoading={isLoading}
              isPast
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ClosureItemProps {
  closure: Closure;
  onDelete: (closure: Closure) => void;
  isLoading?: boolean;
  isPast?: boolean;
}

function ClosureItem({
  closure,
  onDelete,
  isLoading,
  isPast,
}: ClosureItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isPast ? "bg-gray-50 text-gray-500" : "bg-white"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${isPast ? "text-gray-500" : "text-gray-900"}`}
          >
            {formatDate(closure.date)}
          </span>
          {closure.isAllDay === false &&
            closure.startTime &&
            closure.endTime && (
              <span className="text-sm text-gray-500">
                ({closure.startTime} - {closure.endTime})
              </span>
            )}
          {closure.isAllDay !== false && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              All day
            </span>
          )}
        </div>
        {closure.reason && (
          <p
            className={`text-sm ${isPast ? "text-gray-400" : "text-gray-500"}`}
          >
            {closure.reason}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(closure)}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Delete
      </Button>
    </div>
  );
}
