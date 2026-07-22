import type { SVGProps } from "react";

/**
 * Social platform marks, vendored from Lucide.
 *
 * lucide-react 1.x removed every brand icon (Facebook, Instagram, YouTube,
 * LinkedIn and the rest) — they are trademarks, and the project stopped
 * shipping them rather than keep redistributing them. The glyphs below are
 * Lucide's own outline paths, copied verbatim from lucide-react 0.555.0 so the
 * icons look identical to before and stay consistent with the outline set used
 * everywhere else in the app. Lucide is ISC licensed, which permits this.
 *
 * Same call signature as a Lucide icon, so `<Facebook className="h-5 w-5" />`
 * keeps working unchanged. None of these carry an accessible name: every call
 * site already labels the link (an `sr-only` span or adjacent text), and a
 * second name would make screen readers announce the platform twice.
 */
function SocialIcon({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Facebook(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </SocialIcon>
  );
}

export function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialIcon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </SocialIcon>
  );
}

export function Youtube(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialIcon {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </SocialIcon>
  );
}

export function Linkedin(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialIcon {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </SocialIcon>
  );
}
