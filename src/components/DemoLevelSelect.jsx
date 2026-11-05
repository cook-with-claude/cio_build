import { GraduationCap } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LEVELS } from '@/data/mockData'

// Demo-only: which level the student side acts as (Terminale, Première,
// Seconde), to show the « Terminale only until the Toussaint » rule. In the
// real app, the level comes from the school roster.
export default function DemoLevelSelect({ level, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" />
      <span id="demo-level-label" className="text-sm text-muted-foreground">
        Niveau de l’élève (démo)
      </span>
      <Select value={level} onValueChange={onChange}>
        <SelectTrigger
          aria-labelledby="demo-level-label"
          className="w-32 bg-background data-[size=default]:h-11 md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
