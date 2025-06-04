"use server"

import { createServerClient } from "../../lib/supabase"
import type { Attribute } from "../../types/attributes"

export async function getAllAttributes(): Promise<Attribute[]> {
  console.log("📖 Reading attributes from Supabase...")
  const supabase = createServerClient()

  const { data: attributes, error } = await supabase
    .from("attributes")
    .select("*")
    .order("entity_type", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("❌ Error fetching attributes:", error)
    throw new Error(`Failed to fetch attributes: ${error.message}`)
  }

  const transformedAttributes: Attribute[] = attributes.map((attr) => ({
    id: attr.id,
    name: attr.name,
    category: attr.category || undefined,
    description: attr.description || undefined,
    entityType: attr.entity_type as "person" | "event" | "place" | "all",
    createdAt: new Date(attr.created_at),
    updatedAt: new Date(attr.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedAttributes.length} attributes from Supabase`)
  return transformedAttributes
}

export async function getAttributesByEntityType(entityType: "person" | "event" | "place"): Promise<Attribute[]> {
  console.log(`📖 Reading ${entityType} attributes from Supabase...`)
  const supabase = createServerClient()

  const { data: attributes, error } = await supabase
    .from("attributes")
    .select("*")
    .in("entity_type", [entityType, "all"])
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("❌ Error fetching attributes by entity type:", error)
    throw new Error(`Failed to fetch ${entityType} attributes: ${error.message}`)
  }

  const transformedAttributes: Attribute[] = attributes.map((attr) => ({
    id: attr.id,
    name: attr.name,
    category: attr.category || undefined,
    description: attr.description || undefined,
    entityType: attr.entity_type as "person" | "event" | "place" | "all",
    createdAt: new Date(attr.created_at),
    updatedAt: new Date(attr.updated_at),
  }))

  console.log(`✅ Retrieved ${transformedAttributes.length} ${entityType} attributes from Supabase`)
  return transformedAttributes
}

export async function addAttribute(
  name: string,
  category?: string,
  entityType: "person" | "event" | "place" | "all" = "all",
): Promise<Attribute> {
  console.log("💾 Adding attribute to Supabase:", name)
  const supabase = createServerClient()

  const attributeToInsert = {
    name: name.trim(),
    category: category || "Custom",
    description: `Custom attribute: ${name}`,
    entity_type: entityType,
  }

  const { data: newAttribute, error } = await supabase.from("attributes").insert(attributeToInsert).select().single()

  if (error) {
    console.error("❌ Error adding attribute:", error)
    throw new Error(`Failed to add attribute: ${error.message}`)
  }

  const transformedAttribute: Attribute = {
    id: newAttribute.id,
    name: newAttribute.name,
    category: newAttribute.category,
    description: newAttribute.description,
    entityType: newAttribute.entity_type as "person" | "event" | "place" | "all",
    createdAt: new Date(newAttribute.created_at),
    updatedAt: new Date(newAttribute.updated_at),
  }

  console.log(`✅ Successfully added ${entityType} attribute: ${transformedAttribute.name}`)
  return transformedAttribute
}

export async function searchAttributes(query: string, entityType?: "person" | "event" | "place"): Promise<Attribute[]> {
  console.log(`🔍 Searching attributes for: "${query}" (entity: ${entityType || "all"})`)
  const supabase = createServerClient()

  let queryBuilder = supabase.from("attributes").select("*").ilike("name", `%${query}%`)

  if (entityType) {
    queryBuilder = queryBuilder.in("entity_type", [entityType, "all"])
  }

  const { data: attributes, error } = await queryBuilder
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("❌ Error searching attributes:", error)
    throw new Error(`Failed to search attributes: ${error.message}`)
  }

  const transformedAttributes: Attribute[] = attributes.map((attr) => ({
    id: attr.id,
    name: attr.name,
    category: attr.category || undefined,
    description: attr.description || undefined,
    entityType: attr.entity_type as "person" | "event" | "place" | "all",
    createdAt: new Date(attr.created_at),
    updatedAt: new Date(attr.updated_at),
  }))

  console.log(`✅ Found ${transformedAttributes.length} attributes matching "${query}"`)
  return transformedAttributes
}
