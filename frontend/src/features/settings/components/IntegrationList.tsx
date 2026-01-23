"use client";

import { Button } from "@/package/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/package/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, RefreshCw, Copy } from "lucide-react";
import type { Integration } from "@/shared/types";

interface IntegrationListProps {
  integrations: Integration[];
  onEdit: (integration: Integration) => void;
  onDelete: (integration: Integration) => void;
  onRegenerateSecret: (integration: Integration) => void;
  isLoading?: boolean;
}

export function IntegrationList({
  integrations,
  onEdit,
  onDelete,
  onRegenerateSecret,
  isLoading,
}: IntegrationListProps) {
  if (integrations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No integrations yet.</p>
        <p className="text-sm mt-1">
          Create one to allow external systems to connect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {integrations.map((integration) => (
        <div
          key={integration.integrationId}
          className={`flex items-center justify-between p-4 border rounded-lg ${
            integration.isActive ? "bg-white" : "bg-gray-50"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{integration.name}</span>
              {!integration.isActive && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                  Inactive
                </span>
              )}
            </div>
            {integration.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {integration.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {integration.permissions.length > 0 ? (
                integration.permissions.slice(0, 3).map((permission) => (
                  <span
                    key={permission}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No permissions</span>
              )}
              {integration.permissions.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  +{integration.permissions.length - 3} more
                </span>
              )}
            </div>
            {integration.webhookUrl && (
              <p className="text-xs text-gray-400 mt-1.5 truncate">
                Webhook: {integration.webhookUrl}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(integration)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRegenerateSecret(integration)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Secret
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(integration)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
