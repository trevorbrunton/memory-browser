"use server"

import { createServerClient } from "../../lib/supabase"
import type { Place } from "../../types/places"

export async function getAllPlaces(): Promise<Place[]> {
  console.log("🏢 Reading places from Supabase...")
  const supabase = createServerClient()

  const { data: places, error } = await supabase
    .from("places")
    .select(`
      *,
      place_attributes (
        attribute,
        value
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("❌ Error fetching places:", error)
    throw new Error(`Failed to fetch places: ${error.message}`)
  }

  const transformedPlaces: Place[] = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address || undefined,
    city: place.city,
    country: place.country,
    type: place.type as Place["type"],
    capacity: place.capacity || undefined,
    rating: place.rating || undefined,
    attributes:
      place.place_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedPlaces.length} places from Supabase`)
  return transformedPlaces
}

export async function addPlaces(
  placeData: { name: string; address?: string; city: string; country: string; type: Place["type"] }[],
): Promise<Place[]> {
  console.log(
    "💾 Adding places to Supabase:",
    placeData.map((p) => p.name),
  )
  const supabase = createServerClient()

  const placesToInsert = placeData.map((data) => ({
    name: data.name.trim(),
    address: data.address || "Address TBD",
    city: data.city,
    country: data.country,
    type: data.type,
    capacity: 50,
    rating: 4.0,
  }))

  const { data: newPlaces, error } = await supabase.from("places").insert(placesToInsert).select()

  if (error) {
    console.error("❌ Error adding places:", error)
    throw new Error(`Failed to add places: ${error.message}`)
  }

  const transformedPlaces: Place[] = newPlaces.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    country: place.country,
    type: place.type as Place["type"],
    capacity: place.capacity,
    rating: place.rating,
    attributes: [],
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  }))

  console.log(`✅ Successfully added ${transformedPlaces.length} places to Supabase`)
  return transformedPlaces
}

export async function updatePlace(
  id: string,
  updates: Partial<Omit<Place, "id" | "createdAt">>,
): Promise<Place | null> {
  console.log(`🔄 Updating place ${id} in Supabase:`, updates)
  const supabase = createServerClient()

  const { attributes, ...placeUpdates } = updates

  const dbUpdates = {
    ...placeUpdates,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedPlace, error } = await supabase.from("places").update(dbUpdates).eq("id", id).select().single()

  if (error) {
    console.error("❌ Error updating place:", error)
    return null
  }

  // Update attributes if provided
  if (attributes && attributes.length > 0) {
    await supabase.from("place_attributes").delete().eq("place_id", id)

    const attributesToInsert = attributes.map((attr) => ({
      place_id: id,
      attribute: attr.attribute,
      value: attr.value,
    }))

    await supabase.from("place_attributes").insert(attributesToInsert)
  }

  // Fetch complete updated place with attributes
  const { data: completePlace } = await supabase
    .from("places")
    .select(`
      *,
      place_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  const transformedPlace: Place = {
    id: completePlace.id,
    name: completePlace.name,
    address: completePlace.address,
    city: completePlace.city,
    country: completePlace.country,
    type: completePlace.type as Place["type"],
    capacity: completePlace.capacity,
    rating: completePlace.rating,
    attributes:
      completePlace.place_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(completePlace.created_at),
    updatedAt: new Date(completePlace.updated_at),
  }

  console.log(`✅ Successfully updated place ${id}`)
  return transformedPlace
}

export async function deletePlace(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting place ${id} from Supabase...`)
  const supabase = createServerClient()

  const { error } = await supabase.from("places").delete().eq("id", id)

  if (error) {
    console.error("❌ Error deleting place:", error)
    return false
  }

  console.log(`✅ Successfully deleted place ${id}`)
  return true
}

export async function searchPlaces(query: string): Promise<Place[]> {
  console.log(`🔍 Searching places for: "${query}"`)
  const supabase = createServerClient()

  const { data: places, error } = await supabase
    .from("places")
    .select(`
      *,
      place_attributes (
        attribute,
        value
      )
    `)
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("❌ Error searching places:", error)
    throw new Error(`Failed to search places: ${error.message}`)
  }

  const transformedPlaces: Place[] = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    country: place.country,
    type: place.type as Place["type"],
    capacity: place.capacity,
    rating: place.rating,
    attributes:
      place.place_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  }))

  console.log(`✅ Found ${transformedPlaces.length} places matching "${query}"`)
  return transformedPlaces
}

export async function getPlaceDetails(id: string): Promise<Place | null> {
  console.log(`📖 Reading place details for ID: ${id}`)
  const supabase = createServerClient()

  const { data: place, error } = await supabase
    .from("places")
    .select(`
      *,
      place_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("❌ Error fetching place details:", error)
    return null
  }

  const transformedPlace: Place = {
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    country: place.country,
    type: place.type as Place["type"],
    capacity: place.capacity,
    rating: place.rating,
    attributes:
      place.place_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(place.created_at),
    updatedAt: new Date(place.updated_at),
  }

  console.log(`✅ Retrieved place details for: ${transformedPlace.name}`)
  return transformedPlace
}
