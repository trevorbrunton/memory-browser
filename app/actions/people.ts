"use server"

import { createServerClient } from "../../lib/supabase"
import type { Person } from "../../types/people"

// Server actions for people using Supabase
export async function getAllPeople(): Promise<Person[]> {
  console.log("📖 Reading people from Supabase...")
  const supabase = createServerClient()

  const { data: people, error } = await supabase
    .from("people")
    .select(`
      *,
      person_attributes (
        attribute,
        value
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("❌ Error fetching people:", error)
    throw new Error(`Failed to fetch people: ${error.message}`)
  }

  // Transform the data to match our Person interface
  const transformedPeople: Person[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    email: person.email || undefined,
    role: person.role || undefined,
    photoUrl: person.photo_url || undefined,
    dateOfBirth: person.date_of_birth || undefined,
    placeOfBirth: person.place_of_birth || undefined,
    maritalStatus: person.marital_status || undefined,
    spouseId: person.spouse_id || undefined,
    attributes:
      person.person_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedPeople.length} people from Supabase`)
  return transformedPeople
}

export async function addPeople(names: string[]): Promise<Person[]> {
  console.log("💾 Adding people to Supabase:", names)
  const supabase = createServerClient()

  const peopleToInsert = names.map((name) => ({
    name: name.trim(),
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    role: "New User",
  }))

  const { data: newPeople, error } = await supabase.from("people").insert(peopleToInsert).select()

  if (error) {
    console.error("❌ Error adding people:", error)
    throw new Error(`Failed to add people: ${error.message}`)
  }

  const transformedPeople: Person[] = newPeople.map((person) => ({
    id: person.id,
    name: person.name,
    email: person.email,
    role: person.role,
    attributes: [],
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  }))

  console.log(`✅ Successfully added ${transformedPeople.length} people to Supabase`)
  return transformedPeople
}

export async function updatePerson(
  id: string,
  updates: Partial<Omit<Person, "id" | "createdAt">>,
): Promise<Person | null> {
  console.log(`🔄 Updating person ${id} in Supabase:`, updates)
  const supabase = createServerClient()

  // Separate attributes from other updates
  const { attributes, ...personUpdates } = updates

  // Transform field names to match database schema
  const dbUpdates: any = {
    ...personUpdates,
    updated_at: new Date().toISOString(),
  }

  if (personUpdates.photoUrl !== undefined) {
    dbUpdates.photo_url = personUpdates.photoUrl
    delete dbUpdates.photoUrl
  }
  if (personUpdates.dateOfBirth !== undefined) {
    dbUpdates.date_of_birth = personUpdates.dateOfBirth
    delete dbUpdates.dateOfBirth
  }
  if (personUpdates.placeOfBirth !== undefined) {
    dbUpdates.place_of_birth = personUpdates.placeOfBirth
    delete dbUpdates.placeOfBirth
  }
  if (personUpdates.maritalStatus !== undefined) {
    dbUpdates.marital_status = personUpdates.maritalStatus
    delete dbUpdates.maritalStatus
  }
  if (personUpdates.spouseId !== undefined) {
    dbUpdates.spouse_id = personUpdates.spouseId
    delete dbUpdates.spouseId
  }

  const { data: updatedPerson, error } = await supabase.from("people").update(dbUpdates).eq("id", id).select().single()

  if (error) {
    console.error("❌ Error updating person:", error)
    return null
  }

  // Update attributes if provided
  if (attributes && attributes.length > 0) {
    // Delete existing attributes
    await supabase.from("person_attributes").delete().eq("person_id", id)

    // Insert new attributes
    const attributesToInsert = attributes.map((attr) => ({
      person_id: id,
      attribute: attr.attribute,
      value: attr.value,
    }))

    await supabase.from("person_attributes").insert(attributesToInsert)
  }

  // Fetch the complete updated person with attributes
  const { data: completePersonData } = await supabase
    .from("people")
    .select(`
      *,
      person_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  const transformedPerson: Person = {
    id: completePersonData.id,
    name: completePersonData.name,
    email: completePersonData.email || undefined,
    role: completePersonData.role || undefined,
    photoUrl: completePersonData.photo_url || undefined,
    dateOfBirth: completePersonData.date_of_birth || undefined,
    placeOfBirth: completePersonData.place_of_birth || undefined,
    maritalStatus: completePersonData.marital_status || undefined,
    spouseId: completePersonData.spouse_id || undefined,
    attributes:
      completePersonData.person_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(completePersonData.created_at),
    updatedAt: new Date(completePersonData.updated_at),
  }

  console.log(`✅ Successfully updated person ${id}`)
  return transformedPerson
}

export async function deletePerson(id: string): Promise<boolean> {
  console.log(`🗑️ Deleting person ${id} from Supabase...`)
  const supabase = createServerClient()

  const { error } = await supabase.from("people").delete().eq("id", id)

  if (error) {
    console.error("❌ Error deleting person:", error)
    return false
  }

  console.log(`✅ Successfully deleted person ${id}`)
  return true
}

export async function searchPeople(query: string): Promise<Person[]> {
  console.log(`🔍 Searching people for: "${query}"`)
  const supabase = createServerClient()

  const { data: people, error } = await supabase
    .from("people")
    .select(`
      *,
      person_attributes (
        attribute,
        value
      )
    `)
    .ilike("name", `%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("❌ Error searching people:", error)
    throw new Error(`Failed to search people: ${error.message}`)
  }

  const transformedPeople: Person[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    email: person.email || undefined,
    role: person.role || undefined,
    photoUrl: person.photo_url || undefined,
    dateOfBirth: person.date_of_birth || undefined,
    placeOfBirth: person.place_of_birth || undefined,
    maritalStatus: person.marital_status || undefined,
    spouseId: person.spouse_id || undefined,
    attributes:
      person.person_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  }))

  console.log(`✅ Found ${transformedPeople.length} people matching "${query}"`)
  return transformedPeople
}

export async function getPersonDetails(id: string): Promise<Person | null> {
  console.log(`📖 Reading person details for ID: ${id}`)
  const supabase = createServerClient()

  const { data: person, error } = await supabase
    .from("people")
    .select(`
      *,
      person_attributes (
        attribute,
        value
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("❌ Error fetching person details:", error)
    return null
  }

  const transformedPerson: Person = {
    id: person.id,
    name: person.name,
    email: person.email || undefined,
    role: person.role || undefined,
    photoUrl: person.photo_url || undefined,
    dateOfBirth: person.date_of_birth || undefined,
    placeOfBirth: person.place_of_birth || undefined,
    maritalStatus: person.marital_status || undefined,
    spouseId: person.spouse_id || undefined,
    attributes:
      person.person_attributes?.map((attr: any) => ({
        attribute: attr.attribute,
        value: attr.value,
      })) || [],
    createdAt: new Date(person.created_at),
    updatedAt: new Date(person.updated_at),
  }

  console.log(`✅ Retrieved person details for: ${transformedPerson.name}`)
  return transformedPerson
}
