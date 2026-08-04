type IconProps = { className?: string };

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.57h-3.14v14.15c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 0 1-2.77-2.77 2.77 2.77 0 0 1 2.77-2.77c.29 0 .57.04.83.13V10.6a6 6 0 0 0-.83-.06 5.92 5.92 0 0 0-5.92 5.92A5.92 5.92 0 0 0 9.29 22.38a5.92 5.92 0 0 0 5.92-5.92V8.9a8.98 8.98 0 0 0 5.15 1.63V7.4a5.68 5.68 0 0 1-3.76-1.58z" />
    </svg>
  );
}

function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.376.55A3.016 3.016 0 0 0 .502 6.186 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .502 5.814 3.016 3.016 0 0 0 2.122 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.376-.55a3.016 3.016 0 0 0 2.122-2.136A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12z" />
    </svg>
  );
}

function RedditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 3.53 12.42c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.443 4.744-1.51l.885-4.17a.36.36 0 0 1 .43-.278l2.774.575a1.24 1.24 0 0 1 1.12-.712zM9.25 12a1.25 1.25 0 0 0-1.25 1.25c0 .687.562 1.248 1.25 1.248a1.25 1.25 0 0 0 1.25-1.25c0-.687-.563-1.248-1.25-1.248zm5.5 0a1.25 1.25 0 0 0-1.25 1.25c0 .687.563 1.248 1.25 1.248a1.25 1.25 0 0 0 1.25-1.25c0-.687-.563-1.248-1.25-1.248zm-5.466 3.99a.327.327 0 0 0-.232.557c.6.596 1.755.647 2.076.647.322 0 1.476-.05 2.076-.647a.328.328 0 1 0-.463-.464c-.36.36-1.19.484-1.613.484-.422 0-1.252-.124-1.613-.484a.325.325 0 0 0-.23-.093z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/AlmintasV", Icon: XIcon },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61592694997024",
    Icon: FacebookIcon,
  },
  { label: "TikTok", href: "https://www.tiktok.com/@getalpha.org", Icon: TikTokIcon },
  { label: "YouTube", href: "https://www.youtube.com/@getALPHA_org", Icon: YouTubeIcon },
  { label: "Reddit", href: "https://www.reddit.com/user/getALPHA_org", Icon: RedditIcon },
];

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-zinc-500 transition-all duration-300 ease-in-out hover:text-accent"
        >
          <Icon className="size-4" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
