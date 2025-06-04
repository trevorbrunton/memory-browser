"use server"

import { createServerClient } from "../../lib/supabase"
import type { Memory, MediaType, Reflection } from "../../types/memories"

export async function getAllMemories(): Promise<Memory[]> {
  console.log("💭 Reading memories from Supabase...")
  const supabase = createServerClient()

  const { data: memories, error } = await supabase
    .from("memories")
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .order("date", { ascending: false })

  if (error) {
    console.error("❌ Error fetching memories:", error)
    throw new Error(`Failed to fetch memories: ${error.message}`)
  }

  const transformedMemories: Memory[] = memories.map((memory) => ({
    id: memory.id,
    title: memory.title,
    description: memory.description || undefined,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    mediaName: memory.media_name,
    mediaSize: memory.media_size,
    date: new Date(memory.date),
    peopleIds: memory.memory_people?.map((mp: any) => mp.person_id) || [],
    placeId: memory.place_id || undefined,
    eventId: memory.event_id || undefined,
    reflections:
      memory.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedMemories.length} memories from Supabase`)
  return transformedMemories
}

export async function addMemory(memoryData: {
  title: string
  description?: string
  mediaType: MediaType
  mediaUrl: string
  mediaName: string
  mediaSize: number
  date: Date
  peopleIds: string[]
  placeId?: string
  eventId?: string
}): Promise<Memory> {
  console.log("💾 Adding memory to Supabase:", memoryData.title)
  const supabase = createServerClient()

  const memoryToInsert = {
    title: memoryData.title.trim(),
    description: memoryData.description?.trim() || null,
    media_type: memoryData.mediaType,
    media_url: memoryData.mediaUrl,
    media_name: memoryData.mediaName,
    media_size: memoryData.mediaSize,
    date: memoryData.date.toISOString(),
    place_id: memoryData.placeId || null,
    event_id: memoryData.eventId || null,
  }

  const { data: newMemory, error } = await supabase
    .from("memories")
    .insert(memoryToInsert)
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .single()

  if (error) {
    console.error("❌ Error adding memory:", error)
    throw new Error(`Failed to add memory: ${error.message}`)
  }

  // Add people associations
  if (memoryData.peopleIds.length > 0) {
    const peopleAssociations = memoryData.peopleIds.map((personId) => ({
      memory_id: newMemory.id,
      person_id: personId,
    }))

    const { error: peopleError } = await supabase.from("memory_people").insert(peopleAssociations)

    if (peopleError) {
      console.error("❌ Error adding memory-people associations:", peopleError)
    }
  }

  const transformedMemory: Memory = {
    id: newMemory.id,
    title: newMemory.title,
    description: newMemory.description,
    mediaType: newMemory.media_type as MediaType,
    mediaUrl: newMemory.media_url,
    mediaName: newMemory.media_name,
    mediaSize: newMemory.media_size,
    date: new Date(newMemory.date),
    peopleIds: memoryData.peopleIds,
    placeId: newMemory.place_id,
    eventId: newMemory.event_id,
    reflections:
      newMemory.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(newMemory.created_at),
    updatedAt: new Date(newMemory.updated_at),
  }

  console.log(`✅ Successfully added memory: ${transformedMemory.title}`)
  return transformedMemory
}

export async function updateMemory(
  id: string,
  updates: Partial<Omit<Memory, "id" | "createdAt">>,
): Promise<Memory | null> {
  console.log(`🔄 Updating memory ${id} in Supabase:`, updates)
  const supabase = createServerClient()

  const { peopleIds, reflections, ...memoryUpdates } = updates

  const dbUpdates: any = {
    ...memoryUpdates,
    updated_at: new Date().toISOString(),
  }

  // Transform field names to match database schema
  if (memoryUpdates.mediaType !== undefined) {
    dbUpdates.media_type = memoryUpdates.mediaType
    delete dbUpdates.mediaType
  }
  if (memoryUpdates.mediaUrl !== undefined) {
    dbUpdates.media_url = memoryUpdates.mediaUrl
    delete dbUpdates.mediaUrl
  }
  if (memoryUpdates.mediaName !== undefined) {
    dbUpdates.media_name = memoryUpdates.mediaName
    delete dbUpdates.mediaName
  }
  if (memoryUpdates.mediaSize !== undefined) {
    dbUpdates.media_size = memoryUpdates.mediaSize
    delete dbUpdates.mediaSize
  }
  if (memoryUpdates.date) {
    dbUpdates.date = memoryUpdates.date.toISOString()
  }
  if (memoryUpdates.placeId !== undefined) {
    dbUpdates.place_id = memoryUpdates.placeId
    delete dbUpdates.placeId
  }
  if (memoryUpdates.eventId !== undefined) {
    dbUpdates.event_id = memoryUpdates.eventId
    delete dbUpdates.eventId
  }

  const { data: updatedMemory, error } = await supabase
    .from("memories")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("❌ Error updating memory:", error)
    return null
  }

  // Update people associations if provided
  if (peopleIds !== undefined) {
    // Delete existing associations
    await supabase.from("memory_people").delete().eq("memory_id", id)

    // Insert new associations
    if (peopleIds.length > 0) {
      const peopleAssociations = peopleIds.map((personId) => ({
        memory_id: id,
        person_id: personId,
      }))

      await supabase.from("memory_people").insert(peopleAssociations)
    }
  }

  // Fetch complete updated memory with people and reflections
  const { data: completeMemory } = await supabase
    .from("memories")
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .eq("id", id)
    .single()

  const transformedMemory: Memory = {
    id: completeMemory.id,
    title: completeMemory.title,
    description: completeMemory.description,
    mediaType: completeMemory.media_type as MediaType,
    mediaUrl: completeMemory.media_url,
    mediaName: completeMemory.media_name,
    mediaSize: completeMemory.media_size,
    date: new Date(completeMemory.date),
    peopleIds: completeMemory.memory_people?.map((mp: any) => mp.person_id) || [],
    placeId: completeMemory.place_id,
    eventId: completeMemory.event_id,
    reflections:
      completeMemory.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(completeMemory.created_at),
    updatedAt: new Date(completeMemory.updated_at),
  }

  console.log(`✅ Successfully updated memory ${id}`)
  return transformedMemory
}

export async function updateMemoryEvent(memoryId: string, eventId: string | null): Promise<Memory | null> {
  console.log(`🔄 Updating memory ${memoryId} with event ${eventId}`)
  const supabase = createServerClient()

  // If eventId is null, just clear both event and place
  if (!eventId) {
    const { data, error } = await supabase
      .from("memories")
      .update({
        event_id: null,
        place_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memoryId)
      .select(`
        *,
        memory_people (
          person_id
        ),
        reflections (
          id,
          title,
          content,
          created_at,
          updated_at
        )
      `)
      .single()

    if (error) {
      console.error("❌ Error removing event from memory:", error)
      return null
    }

    const transformedMemory: Memory = {
      id: data.id,
      title: data.title,
      description: data.description,
      mediaType: data.media_type as MediaType,
      mediaUrl: data.media_url,
      mediaName: data.media_name,
      mediaSize: data.media_size,
      date: new Date(data.date),
      peopleIds: data.memory_people?.map((mp: any) => mp.person_id) || [],
      placeId: null,
      eventId: null,
      reflections:
        data.reflections?.map((r: any) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        })) || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }

    console.log(`✅ Successfully removed event from memory ${memoryId}`)
    return transformedMemory
  }

  // First, get the event to find its place
  const { data: event, error: eventError } = await supabase.from("events").select("place_id").eq("id", eventId).single()

  if (eventError) {
    console.error("❌ Error fetching event:", eventError)
    return null
  }

  // Update the memory with both the event and its place
  const { data, error } = await supabase
    .from("memories")
    .update({
      event_id: eventId,
      place_id: event.place_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .single()

  if (error) {
    console.error("❌ Error updating memory with event:", error)
    return null
  }

  const transformedMemory: Memory = {
    id: data.id,
    title: data.title,
    description: data.description,
    mediaType: data.media_type as MediaType,
    mediaUrl: data.media_url,
    mediaName: data.media_name,
    mediaSize: data.media_size,
    date: new Date(data.date),
    peopleIds: data.memory_people?.map((mp: any) => mp.person_id) || [],
    placeId: data.place_id,
    eventId: data.event_id,
    reflections:
      data.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }

  console.log(`✅ Successfully updated memory ${memoryId} with event ${eventId}`)
  return transformedMemory
}

export async function deleteMemory(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting memory ${id} from Supabase...`)
  const supabase = createServerClient()

  const { error } = await supabase.from("memories").delete().eq("id", id)

  if (error) {
    console.error("❌ Error deleting memory:", error)
    return false
  }

  console.log(`✅ Successfully deleted memory ${id}`)
  return true
}

export async function searchMemories(query: string): Promise<Memory[]> {
  console.log(`🔍 Searching memories for: "${query}"`)
  const supabase = createServerClient()

  const { data: memories, error } = await supabase
    .from("memories")
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,media_name.ilike.%${query}%`)
    .order("date", { ascending: false })

  if (error) {
    console.error("❌ Error searching memories:", error)
    throw new Error(`Failed to search memories: ${error.message}`)
  }

  const transformedMemories: Memory[] = memories.map((memory) => ({
    id: memory.id,
    title: memory.title,
    description: memory.description,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    mediaName: memory.media_name,
    mediaSize: memory.media_size,
    date: new Date(memory.date),
    peopleIds: memory.memory_people?.map((mp: any) => mp.person_id) || [],
    placeId: memory.place_id,
    eventId: memory.event_id,
    reflections:
      memory.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  }))

  console.log(`✅ Found ${transformedMemories.length} memories matching "${query}"`)
  return transformedMemories
}

export async function getMemoryDetails(id: string): Promise<Memory | null> {
  console.log(`📖 Reading memory details for ID: ${id}`)
  const supabase = createServerClient()

  const { data: memory, error } = await supabase
    .from("memories")
    .select(`
      *,
      memory_people (
        person_id
      ),
      reflections (
        id,
        title,
        content,
        created_at,
        updated_at
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("❌ Error fetching memory details:", error)
    return null
  }

  const transformedMemory: Memory = {
    id: memory.id,
    title: memory.title,
    description: memory.description,
    mediaType: memory.media_type as MediaType,
    mediaUrl: memory.media_url,
    mediaName: memory.media_name,
    mediaSize: memory.media_size,
    date: new Date(memory.date),
    peopleIds: memory.memory_people?.map((mp: any) => mp.person_id) || [],
    placeId: memory.place_id,
    eventId: memory.event_id,
    reflections:
      memory.reflections?.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || [],
    createdAt: new Date(memory.created_at),
    updatedAt: new Date(memory.updated_at),
  }

  console.log(`✅ Retrieved memory details for: ${transformedMemory.title}`)
  return transformedMemory
}

// Mock file upload function - in production, this would upload to Supabase Storage
export async function uploadMemoryFile(file: File): Promise<{ url: string; name: string; size: number }> {
  console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`)

  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In production, you would upload to Supabase Storage:
  // const supabase = createServerClient()
  // const { data, error } = await supabase.storage
  //   .from('memories')
  //   .upload(`${Date.now()}-${file.name}`, file)

  const isImage = file.type.startsWith("image/")
  const query = encodeURIComponent(file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " "))

  const url = isImage
    ? `/placeholder.svg?height=800&width=1200&query=${query}`
    : `/placeholder.svg?height=800&width=600&query=${query}`

  console.log(`✅ File uploaded successfully: ${url}`)

  return {
    url,
    name: file.name,
    size: file.size,
  }
}

export async function addReflection(memoryId: string, title: string, content: string): Promise<Reflection> {
  console.log(`💭 Adding reflection to memory ${memoryId}`)
  const supabase = createServerClient()

  const { data: newReflection, error } = await supabase
    .from("reflections")
    .insert({
      memory_id: memoryId,
      title: title.trim(),
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error("❌ Error adding reflection:", error)
    throw new Error(`Failed to add reflection: ${error.message}`)
  }

  const transformedReflection: Reflection = {
    id: newReflection.id,
    title: newReflection.title,
    content: newReflection.content,
    createdAt: new Date(newReflection.created_at),
    updatedAt: new Date(newReflection.updated_at),
  }

  console.log(`✅ Successfully added reflection to memory ${memoryId}`)
  return transformedReflection
}

export async function updateReflection(
  reflectionId: string,
  title: string,
  content: string,
): Promise<Reflection | null> {
  console.log(`🔄 Updating reflection ${reflectionId}`)
  const supabase = createServerClient()

  const { data: updatedReflection, error } = await supabase
    .from("reflections")
    .update({
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reflectionId)
    .select()
    .single()

  if (error) {
    console.error("❌ Error updating reflection:", error)
    return null
  }

  const transformedReflection: Reflection = {
    id: updatedReflection.id,
    title: updatedReflection.title,
    content: updatedReflection.content,
    createdAt: new Date(updatedReflection.created_at),
    updatedAt: new Date(updatedReflection.updated_at),
  }

  console.log(`✅ Successfully updated reflection ${reflectionId}`)
  return transformedReflection
}

export async function deleteReflection(reflectionId: string): Promise<boolean> {
  console.log(`🗑️ Deleting reflection ${reflectionId}`)
  const supabase = createServerClient()

  const { error } = await supabase.from("reflections").delete().eq("id", reflectionId)

  if (error) {
    console.error("❌ Error deleting reflection:", error)
    return false
  }

  console.log(`✅ Successfully deleted reflection ${reflectionId}`)
  return true
}
