import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SportFiltersProps {
  selectedSports: string[]
  onSportsChange: (sports: string[]) => void
}

const sports = ["Football", "Badminton", "Basketball", "Hiking"]

export function SportFilters({ selectedSports, onSportsChange }: SportFiltersProps) {
  const handleSportToggle = (sport: string) => {
    if (selectedSports.includes(sport)) {
      onSportsChange(selectedSports.filter((s) => s !== sport))
    } else {
      onSportsChange([...selectedSports, sport])
    }
  }

  return (
    <div className="flex flex-wrap gap-8">
      {sports.map((sport) => (
        <div key={sport} className="flex items-center space-x-3">
          <Checkbox
            id={sport}
            checked={selectedSports.includes(sport)}
            onCheckedChange={() => handleSportToggle(sport)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
          />
          <Label
            htmlFor={sport}
            className="text-lg font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors"
          >
            {sport}
          </Label>
        </div>
      ))}
    </div>
  )
}
