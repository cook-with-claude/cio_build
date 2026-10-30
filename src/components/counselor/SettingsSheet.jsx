import { Monitor, Moon, Settings, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/dates'
import { DEFAULT_SLOT_MINUTES, SLOT_LENGTHS } from '@/lib/rules'

const CUTOFF_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

// Same order as THEMES in src/lib/theme.js.
const THEME_OPTIONS = [
  { id: 'system', label: 'Système', icon: Monitor, hint: 'Suit le réglage de l’appareil (clair ou sombre).' },
  { id: 'light', label: 'Clair', icon: Sun, hint: 'Toujours clair.' },
  { id: 'dark', label: 'Sombre', icon: Moon, hint: 'Toujours sombre.' },
]

// Counselor settings. Changes apply immediately: no "save" button to forget.
export default function SettingsSheet({ settings, onChange, theme, onThemeChange }) {
  const themeHint = THEME_OPTIONS.find((t) => t.id === theme)?.hint

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-11 gap-2 md:h-10">
          <Settings aria-hidden="true" />
          Réglages
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Réglages</SheetTitle>
          <SheetDescription>Les modifications s’appliquent immédiatement.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="slot-length">Durée d’un créneau</Label>
            <Select
              value={String(settings.slotMinutes)}
              onValueChange={(v) => onChange({ slotMinutes: Number(v) })}
            >
              <SelectTrigger id="slot-length" className="w-full data-[size=default]:h-11 md:data-[size=default]:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_LENGTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes{m === DEFAULT_SLOT_MINUTES && ' (par défaut)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">S’applique aux semaines pas encore préparées.</p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="cutoff">Heure limite la veille</Label>
            <Select value={settings.cutoffTime} onValueChange={(v) => onChange({ cutoffTime: v })}>
              <SelectTrigger id="cutoff" className="w-full data-[size=default]:h-11 md:data-[size=default]:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUTOFF_TIMES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatTime(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Les rendez-vous d’un jour sont arrêtés la veille (le vendredi pour le lundi) à{' '}
              {formatTime(settings.cutoffTime)} : après cette heure, les élèves ne peuvent plus réserver,
              et ne peuvent annuler qu’en indiquant un motif.
            </p>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="approval">Valider chaque réservation</Label>
              <p className="text-sm text-muted-foreground">
                {settings.approvalMode
                  ? 'Activé : chaque réservation devient une demande que vous acceptez ou refusez.'
                  : 'Désactivé : les réservations sont confirmées automatiquement.'}
              </p>
            </div>
            <Switch
              id="approval"
              checked={settings.approvalMode}
              onCheckedChange={(checked) => onChange({ approvalMode: checked })}
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Demo shortcut: this also changes the student view (see src/lib/theme.js). */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label id="theme-label">Thème</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={theme}
                // Ignore clicks on the already-selected option (one theme is always active).
                onValueChange={(value) => value && onThemeChange(value)}
                aria-labelledby="theme-label"
                className="shrink-0 rounded-lg bg-background"
              >
                {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <Tooltip key={id}>
                    {/* The tooltip takes over data-state, so "selected" is read from aria-checked. */}
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={id}
                        aria-label={label}
                        className="size-11 px-0 md:size-9 aria-checked:bg-primary aria-checked:text-primary-foreground"
                      >
                        <Icon aria-hidden="true" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
            </div>
            <p className="text-sm text-muted-foreground">
              {themeHint} Pour la démo, s’applique aussi à la vue élève.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
