export default function Turbo0Badge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://turbo0.com/item/getalpha"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- badge served by Turbo0, no local asset to optimise */}
      <img
        src="https://img.turbo0.com/badge-listed-dark.svg"
        alt="Listed on Turbo0"
        style={{ height: "32px", width: "auto" }}
      />
    </a>
  );
}
