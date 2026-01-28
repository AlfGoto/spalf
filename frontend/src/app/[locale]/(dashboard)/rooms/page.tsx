import { RoomsPage, listRooms } from "@/features/rooms"

export default async function Page() {
  const { data: rooms, error } = await listRooms()

  if (error) {
    console.error("Failed to fetch rooms:", error)
  }

  return <RoomsPage initialRooms={rooms || []} />
}
