const BODY =
  'M4 0h2v1H4zM14 0h2v1H14zM3 1h4v1H3zM13 1h4v1H13zM2 2h15v1H2zM2 3h16v1H2zM1 4h18v1H1zM1 5h5v1H1zM7 5h6v1H7zM14 5h5v1H14zM1 6h5v1H1zM7 6h6v1H7zM14 6h5v1H14zM1 7h18v1H1zM2 8h16v1H2zM2 9h16v1H2zM3 10h14v1H3zM3 11h13v1H3zM4 12h12v1H4zM4 13h12v1H4zM5 14h11v1H5zM5 15h11v1H5zM6 16h10v1H6zM6 17h12v1H6zM5 18h14v1H5zM5 19h14v1H5z'

const TAIL =
  'M20 9h2v1H20zM19 10h3v1H19zM19 11h2v1H19zM18 12h2v1H18zM16 12h2v1H16zM18 13h2v1H18zM16 13h2v1H16z'

export default function PixelCat({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 20) / 24}
      viewBox="0 0 24 20"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pointer-events-none shrink-0 ${className}`}
    >
      <path fill="currentColor" d={BODY} />
      <g className="cat-tail">
        <path fill="currentColor" d={TAIL} />
      </g>
    </svg>
  )
}