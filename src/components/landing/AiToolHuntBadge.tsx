export default function AiToolHuntBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://aitoolhunt.co/item/getalpha"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- badge served by AIToolHunt, no local asset to optimise */}
      <img
        src="https://aitoolhunt.co/badge-listed-dark.svg"
        alt="Listed on AIToolHunt"
        style={{ height: "32px", width: "auto" }}
      />
    </a>
  );
}
