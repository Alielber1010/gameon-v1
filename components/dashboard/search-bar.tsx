"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  location: string
  onLocationChange: (location: string) => void
}

export function SearchBar({ searchQuery, onSearchChange, location, onLocationChange }: SearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Input
          placeholder="SEARCH GAMES ..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-lg bg-gray-200 border-0 rounded-full placeholder:text-gray-500 text-gray-800 font-medium"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
      </div>

      <div className="flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2 min-w-fit">
        <MapPin className="h-5 w-5 text-gray-600" />
        <Input
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="border-0 bg-transparent text-gray-800 font-medium min-w-[150px]"
        />
        <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:bg-gray-300">
          Location
        </Button>
      </div>
    </div>
  )
}
