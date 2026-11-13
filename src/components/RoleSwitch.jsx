import { GraduationCap, UserRound } from 'lucide-react'
import SegmentedThumb from '@/components/SegmentedThumb'
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
        spacing={1}
        value={role}
        // Ignore clicks on the already-selected option (one role is always active).
        onValueChange={(value) => value && onChange(value)}
        aria-label="Voir en tant que"
        className="relative rounded-xl bg-muted p-1 ring-1 ring-foreground/5"
      >
        {/* Apple experiment: the blue selection slides from one option to the other. */}
        <SegmentedThumb value={role} className="rounded-lg bg-primary shadow-sm shadow-primary/30" />
        {ROLES.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            className="relative z-10 h-10 gap-1.5 rounded-lg px-3 transition-colors duration-300 hover:bg-transparent hover:text-foreground md:h-9 data-[state=on]:bg-transparent data-[state=on]:text-primary-foreground data-[state=on]:hover:text-primary-foreground"
          >
            <Icon aria-hidden="true" />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
