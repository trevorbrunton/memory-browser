"use server"

import { createServerClient } from "../../lib/supabase"
import type { Event } from "../../types/events"

export async function getAllEvents(): Promise<Event[]> {
  console.log("📅 Reading events from Supabase...")
  const supabase = createServerClient()

  const { data: events, error } = await supabase
    .from("events")
    .select(`
      *,
      event_attributes (
        attribute,
        value
      )
    `)
    .order("date", { ascending: false })

  if (error) {
    console.error("❌ Error fetching events:", error)
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  const transformedEvents: Event[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    date: new Date(event.date),
    placeId: event.place_id || undefined,
    type: event.type as Event["type"],
    capacity: event.capacity || undefined,
    attributes:
      event.event_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedEvents.length} events from Supabase`)
  return transformedEvents
}

export async function addEvents(
  eventData: { title: string; description?: string; date: Date; placeId?: string; type: Event["type"] }[],
): Promise<Event[]> {
  console.log(
    "💾 Adding events to Supabase:",
    eventData.map((e) => e.title),
  )
  const supabase = createServerClient()

  const eventsToInsert = eventData.map((data) => ({
    title: data.title.trim(),
    description: data.description || `New ${data.type} event`,
    date: data.date.toISOString(),
    place_id: data.placeId || null,
    type: data.type,
    capacity: 25,
  }))

  const { data: newEvents, error } = await supabase.from("events").insert(eventsToInsert).select()

  if (error) {
    console.error("❌ Error adding events:", error)
    throw new Error(`Failed to add events: ${error.message}`)
  }

  const transformedEvents: Event[] = newEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: new Date(event.date),
    placeId: event.place_id,
    type: event.type as Event["type"],
    capacity: event.capacity,
    attributes: [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  }))

  console.log(`✅ Successfully added ${transformedEvents.length} events to Supabase`)
  return transformedEvents
}

export async function updateEvent(
  id: string,
  updates: Partial<Omit<Event, "id" | "createdAt">>,
): Promise<Event | null> {
  console.log(`🔄 Updating event ${id} in Supabase:`, updates)
  const supabase = createServerClient()

  const { attributes, ...eventUpdates } = updates

  const dbUpdates: any = {
    ...eventUpdates,
    updated_at: new Date().toISOString(),
  }

  if (eventUpdates.date) {
    dbUpdates.date = eventUpdates.date.toISOString()
  }
  if (eventUpdates.placeId !== undefined) {
    dbUpdates.place_id = eventUpdates.placeId
    delete dbUpdates.placeId
  }

  const { data: updatedEvent, error } = await supabase.from("events").update(dbUpdates).eq("id", id).select().single()

  if (error) {
    console.error("❌ Error updating event:", error)
    return null
  }

  // Update attributes if provided
  if (attributes && attributes.length > 0) {
    await supabase.from("event_attributes").delete().eq("event_id", id)

    const attributesToInsert = attributes.map((attr) => ({
      event_id: id,
      attribute: attr.attribute,
      value: attr.value,
    }))

    await supabase.from("event_attributes").insert(attributesToInsert)
  }

  // Fetch complete updated event with attributes
  const { data: completeEvent } = await supabase
    .from("events")
    .select(`
      *,
      event_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  const transformedEvent: Event = {
    id: completeEvent.id,
    title: completeEvent.title,
    description: completeEvent.description,
    date: new Date(completeEvent.date),
    placeId: completeEvent.place_id,
    type: completeEvent.type as Event["type"],
    capacity: completeEvent.capacity,
    attributes:
      completeEvent.event_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(completeEvent.created_at),
    updatedAt: new Date(completeEvent.updated_at),
  }

  console.log(`✅ Successfully updated event ${id}`)
  return transformedEvent
}

export async function deleteEvent(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting event ${id} from Supabase...`)
  const supabase = createServerClient()

  // First, update any memories that reference this event to clear the event and place associations
  const { error: memoryUpdateError } = await supabase
    .from("memories")
    .update({
      event_id: null,
      place_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", id)

  if (memoryUpdateError) {
    console.error("❌ Error updating memories when deleting event:", memoryUpdateError)
    // Continue with deletion even if memory update fails
  } else {
    console.log(`✅ Updated memories to clear references to deleted event ${id}`)
  }

  // Now delete the event
  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    console.error("❌ Error deleting event:", error)
    return false
  }

  console.log(`✅ Successfully deleted event ${id}`)
  return true
}

export async function searchEvents(query: string): Promise<Event[]> {
  console.log(`🔍 Searching events for: "${query}"`)
  const supabase = createServerClient()

  const { data: events, error } = await supabase
    .from("events")
    .select(`
      *,
      event_attributes (
        attribute,
        value
      )
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("date", { ascending: false })

  if (error) {
    console.error("❌ Error searching events:", error)
    throw new Error(`Failed to search events: ${error.message}`)
  }

  const transformedEvents: Event[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: new Date(event.date),
    placeId: event.place_id,
    type: event.type as Event["type"],
    capacity: event.capacity,
    attributes:
      event.event_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  }))

  console.log(`✅ Found ${transformedEvents.length} events matching "${query}"`)
  return transformedEvents
}

export async function getEventDetails(id: string): Promise<Event | null> {
  console.log(`📖 Reading event details for ID: ${id}`)
  const supabase = createServerClient()

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      event_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("❌ Error fetching event details:", error)
    return null
  }

  const transformedEvent: Event = {
    id: event.id,
    title: event.title,
    description: event.description,
    date: new Date(event.date),
    placeId: event.place_id,
    type: event.type as Event["type"],
    capacity: event.capacity,
    attributes:
      event.event_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  }

  console.log(`✅ Retrieved event details for: ${transformedEvent.title}`)
  return transformedEvent
}
