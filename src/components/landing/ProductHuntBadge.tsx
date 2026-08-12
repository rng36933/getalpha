export default function ProductHuntBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.producthunt.com/products/getalpha?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-getalpha"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- badge served by Product Hunt, no local asset to optimise */}
      <img
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1215734&theme=dark"
        alt="getALPHA - A trading journal that judges your process, not your luck | Product Hunt"
        style={{ height: "32px", width: "auto" }}
      />
    </a>
  );
}
