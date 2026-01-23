"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/package/ui/button";
import { API_BASE_URL } from "@/shared/api";
import type {
  Reservation,
  Employee,
  Room,
  Service,
  Client,
  CreateReservationInput,
  UpdateReservationInput,
  ApiListResponse,
} from "@/shared/types";
import { useReservations } from "./hooks/useReservations";
import { ReservationCalendar } from "./components/ReservationCalendar";
import { ReservationForm } from "./components/ReservationForm";
import { ReservationDetails } from "./components/ReservationDetails";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

export function ReservationsPage() {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"day" | "week">("week");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>();
  const [filterRoomId, setFilterRoomId] = useState<string>();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>();
  const [defaultTime, setDefaultTime] = useState<string>();

  // Details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Reservations hook
  const {
    reservations,
    isLoading: reservationsLoading,
    error,
    fetchCalendarReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    clearError,
  } = useReservations();

  // Calculate date range for calendar
  const getDateRange = useCallback(() => {
    if (viewType === "day") {
      const date = currentDate.toISOString().split("T")[0];
      return { startDate: date, endDate: date };
    }
    // Week view: get Sunday to Saturday
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [currentDate, viewType]);

  // Fetch supporting data on mount
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [employeesRes, roomsRes, servicesRes, clientsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/employees?spaId=${SPA_ID}`),
          fetch(`${API_BASE_URL}/api/rooms?spaId=${SPA_ID}`),
          fetch(`${API_BASE_URL}/api/services?spaId=${SPA_ID}`),
          fetch(`${API_BASE_URL}/api/clients?spaId=${SPA_ID}`),
        ]);

        if (employeesRes.ok) {
          const data = (await employeesRes.json()) as ApiListResponse<Employee>;
          setEmployees(data.data);
        }
        if (roomsRes.ok) {
          const data = (await roomsRes.json()) as ApiListResponse<Room>;
          setRooms(data.data);
        }
        if (servicesRes.ok) {
          const data = (await servicesRes.json()) as ApiListResponse<Service>;
          setServices(data.data);
        }
        if (clientsRes.ok) {
          const data = (await clientsRes.json()) as ApiListResponse<Client>;
          setClients(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch reservations when date range or filters change
  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    fetchCalendarReservations(startDate, endDate, {
      employeeId: filterEmployeeId,
      roomId: filterRoomId,
    });
  }, [currentDate, viewType, filterEmployeeId, filterRoomId, fetchCalendarReservations, getDateRange]);

  // Create lookup maps for entities
  const serviceMap = useMemo(
    () => new Map(services.map((s) => [s.serviceId, s])),
    [services]
  );
  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.employeeId, e])),
    [employees]
  );
  const roomMap = useMemo(
    () => new Map(rooms.map((r) => [r.roomId, r])),
    [rooms]
  );
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.clientId, c])),
    [clients]
  );

  // Handle creating a new reservation
  const handleNewReservation = () => {
    setSelectedReservation(null);
    setDefaultDate(currentDate.toISOString().split("T")[0]);
    setDefaultTime("09:00");
    setFormOpen(true);
  };

  // Handle clicking a time slot
  const handleTimeSlotClick = (date: string, time: string) => {
    setSelectedReservation(null);
    setDefaultDate(date);
    setDefaultTime(time);
    setFormOpen(true);
  };

  // Handle clicking a reservation in the calendar
  const handleReservationClick = (reservation: Reservation) => {
    setViewingReservation(reservation);
    setDetailsOpen(true);
  };

  // Handle editing from details view
  const handleEditFromDetails = () => {
    if (viewingReservation) {
      setSelectedReservation(viewingReservation);
      setDetailsOpen(false);
      setFormOpen(true);
    }
  };

  // Handle cancelling from details view
  const handleCancelFromDetails = async () => {
    if (viewingReservation) {
      const success = await cancelReservation(viewingReservation.reservationId);
      if (success) {
        setDetailsOpen(false);
        // Refresh reservations
        const { startDate, endDate } = getDateRange();
        fetchCalendarReservations(startDate, endDate, {
          employeeId: filterEmployeeId,
          roomId: filterRoomId,
        });
      }
    }
  };

  // Handle completing from details view
  const handleCompleteFromDetails = async () => {
    if (viewingReservation) {
      const result = await updateReservation(viewingReservation.reservationId, {
        status: "COMPLETED",
      });
      if (result) {
        setDetailsOpen(false);
        // Refresh reservations
        const { startDate, endDate } = getDateRange();
        fetchCalendarReservations(startDate, endDate, {
          employeeId: filterEmployeeId,
          roomId: filterRoomId,
        });
      }
    }
  };

  // Handle form submission
  const handleFormSubmit = async (
    data: CreateReservationInput | UpdateReservationInput,
    isUpdate: boolean
  ) => {
    let success = false;

    if (isUpdate && selectedReservation) {
      const result = await updateReservation(
        selectedReservation.reservationId,
        data as UpdateReservationInput
      );
      success = !!result;
    } else {
      const result = await createReservation(data as CreateReservationInput);
      success = !!result;
    }

    if (success) {
      setFormOpen(false);
      setSelectedReservation(null);
      // Refresh reservations
      const { startDate, endDate } = getDateRange();
      fetchCalendarReservations(startDate, endDate, {
        employeeId: filterEmployeeId,
        roomId: filterRoomId,
      });
    }
  };

  const isLoading = dataLoading || reservationsLoading;

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage bookings and view the calendar.
          </p>
        </div>
        <Button onClick={handleNewReservation}>New Reservation</Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && employees.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ReservationCalendar
            reservations={reservations}
            employees={employees}
            rooms={rooms}
            services={services}
            clients={clients}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onReservationClick={handleReservationClick}
            onTimeSlotClick={handleTimeSlotClick}
            viewType={viewType}
            onViewTypeChange={setViewType}
            filterEmployeeId={filterEmployeeId}
            filterRoomId={filterRoomId}
            onFilterEmployeeChange={setFilterEmployeeId}
            onFilterRoomChange={setFilterRoomId}
          />
        </div>
      )}

      {/* Reservation Form Dialog */}
      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        reservation={selectedReservation}
        onSubmit={handleFormSubmit}
        isLoading={reservationsLoading}
        services={services}
        employees={employees}
        rooms={rooms}
        clients={clients}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />

      {/* Reservation Details Dialog */}
      <ReservationDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        reservation={viewingReservation}
        service={viewingReservation ? serviceMap.get(viewingReservation.serviceId) : undefined}
        employee={viewingReservation?.employeeId ? employeeMap.get(viewingReservation.employeeId) : undefined}
        room={viewingReservation?.roomId ? roomMap.get(viewingReservation.roomId) : undefined}
        client={viewingReservation ? clientMap.get(viewingReservation.clientId) : undefined}
        onEdit={handleEditFromDetails}
        onCancel={handleCancelFromDetails}
        onComplete={handleCompleteFromDetails}
        isLoading={reservationsLoading}
      />
    </div>
  );
}
