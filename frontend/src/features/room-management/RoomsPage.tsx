"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import { useRooms } from "./hooks/useRooms";
import { RoomTable } from "./components/RoomTable";
import { RoomForm } from "./components/RoomForm";
import { DeleteConfirmDialog } from "@/features/employee-management";
import type { Room, CreateRoomInput } from "@/shared/types";

export function RoomsPage() {
  const {
    rooms,
    isLoading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    clearError,
  } = useRooms();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsFormOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateRoomInput) => {
    if (selectedRoom) {
      const result = await updateRoom(selectedRoom.roomId, data);
      if (result) {
        setIsFormOpen(false);
        setSelectedRoom(null);
      }
    } else {
      const result = await createRoom(data);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedRoom) {
      const success = await deleteRoom(selectedRoom.roomId);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedRoom(null);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your spa rooms and their capacities.
          </p>
        </div>
        <Button onClick={handleAddRoom}>Add Room</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && rooms.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          <p>Loading rooms...</p>
        </div>
      ) : (
        <RoomTable
          rooms={rooms}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoom}
        />
      )}

      <RoomForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        room={selectedRoom}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Room"
        description={`Are you sure you want to delete "${selectedRoom?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
