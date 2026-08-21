const BODY =
  'M4 0h2v1H4zM12 0h2v1H12zM3 1h4v1H3zM11 1h4v1H11zM2 2h14v1H2zM2 3h14v1H2zM1 4h16v1H1zM1 5h4v1H1zM7 5h4v1H7zM13 5h4v1H13zM1 6h4v1H1zM7 6h4v1H7zM13 6h4v1H13zM2 7h14v1H2zM2 8h12v1H2zM2 9h12v1H2zM3 10h10v1H3zM3 11h10v1H3zM4 12h10v1H4zM4 13h3v1H4zM11 13h3v1H11z'

const TAIL_L = 'M0 8h2v1H0zM0 9h2v1H0zM1 10h2v1H1z'
const TAIL_R = 'M14 8h2v1H14zM14 9h2v1H14zM13 10h2v1H13z'

export default function PixelCatFront({
  size = 36,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={(size * 14) / 18}
      viewBox="0 0 18 14"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pointer-events-none shrink-0 ${className}`}
    >
      <g className="tail-l">
        <path fill="currentColor" d={TAIL_L} />
      </g>
      <g className="tail-r">
        <path fill="currentColor" d={TAIL_R} />
      </g>
      <path fill="currentColor" d={BODY} />
    </svg>
  )
}
