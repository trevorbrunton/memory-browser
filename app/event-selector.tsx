import type React from "react"
import { EventSelector as EventSelectorComponent } from "../components/event-selector"
import { usePlaces } from "../hooks/use-places"

type EventSelectorProps = {
  allEvents: any[]
  selectedEvent?: string
  onSelectionChange: (eventId: string) => void
  isLoading?: boolean
}

const EventSelector: React.FC<EventSelectorProps> = ({ allEvents, selectedEvent, onSelectionChange, isLoading }) => {
  const { data: allPlaces = [] } = usePlaces()

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> If the selected event has a location, that place will be automatically associated with
          this memory.
        </p>
      </div>
      <div className="mt-4">
        <EventSelectorComponent
          allEvents={allEvents}
          selectedEvent={selectedEvent}
          onSelectionChange={onSelectionChange}
          isLoading={isLoading}
          allPlaces={allPlaces}
        />
      </div>
    </div>
  )
}

export default EventSelector
