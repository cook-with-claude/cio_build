import { GraduationCap, UserRound } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Demo-only replacement for a login: lets the presenter flip between
// the student view and the counselor view.

const ROLES = [
  { id: 'student', label: 'Élève', icon: GraduationCap },
  { id: 'counselor', label: 'Conseillère', icon: UserRound },
]

export default function RoleSwitch({ role, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">Voir en tant que :</span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={role}
        // Ignore clicks on the already-selected option (one role is always active).
        onValueChange={(value) => value && onChange(value)}
        aria-label="Voir en tant que"
        className="rounded-lg bg-background"
      >
        {ROLES.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            className="h-11 gap-1.5 px-3 md:h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Icon aria-hidden="true" />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
