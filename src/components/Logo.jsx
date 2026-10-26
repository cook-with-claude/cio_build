// The app's logo: a calendar with a check mark. Its top band uses the four
// CPF colours, like the band under the header. public/favicon.svg is the
// same drawing (with plain hex colours): change both together.
export default function Logo({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <clipPath id="logo-calendar">
          <rect x="3" y="4" width="18" height="18" rx="3" />
        </clipPath>
      </defs>
      <rect x="3" y="4" width="18" height="18" rx="3" fill="#fff" />
      {/* Top band: the four CPF colours. */}
      <g clipPath="url(#logo-calendar)">
        <rect x="3" y="4" width="4.5" height="5" fill="var(--cpf-blue)" />
        <rect x="7.5" y="4" width="4.5" height="5" fill="var(--cpf-orange)" />
        <rect x="12" y="4" width="4.5" height="5" fill="var(--cpf-green)" />
        <rect x="16.5" y="4" width="4.5" height="5" fill="var(--cpf-yellow)" />
      </g>
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--cpf-blue-deep)" strokeWidth="1.75" />
      {/* Binder rings. */}
      <path d="M8 2.5v4M16 2.5v4" stroke="var(--cpf-blue-deep)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m8.5 15.5 2.5 2.5 4.5-4.5"
        stroke="var(--cpf-green)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
