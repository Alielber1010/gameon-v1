"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SkillLevelFiltersProps {
  selectedSkillLevels: string[]
  onSkillLevelsChange: (skillLevels: string[]) => void
}

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Professional"]

export function SkillLevelFilters({ selectedSkillLevels, onSkillLevelsChange }: SkillLevelFiltersProps) {
  const handleSkillLevelToggle = (skillLevel: string) => {
    if (selectedSkillLevels.includes(skillLevel)) {
      onSkillLevelsChange(selectedSkillLevels.filter((s) => s !== skillLevel))
    } else {
      onSkillLevelsChange([...selectedSkillLevels, skillLevel])
    }
  }

  return (
    <div className="flex flex-wrap gap-8">
      {skillLevels.map((skillLevel) => (
        <div key={skillLevel} className="flex items-center space-x-3">
          <Checkbox
            id={skillLevel}
            checked={selectedSkillLevels.includes(skillLevel)}
            onCheckedChange={() => handleSkillLevelToggle(skillLevel)}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-2 border-gray-400 w-5 h-5"
          />
          <Label
            htmlFor={skillLevel}
            className="text-lg font-semibold cursor-pointer text-gray-800 hover:text-green-600 transition-colors"
          >
            {skillLevel}
          </Label>
        </div>
      ))}
    </div>
  )
}





