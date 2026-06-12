/** eduboat wordmark — simple SVG: sail glyph + lowercase wordmark. */
export function Logo({ height = 26 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 132 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="eduboat"
      role="img"
    >
      {/* sail mark */}
      <path d="M13 4v15" stroke="#F1F1F1" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 5.5L21.5 18H13z" fill="#5FD4C4" />
      <circle cx="13" cy="4" r="1.6" fill="#F0A35E" />
      <path
        d="M4 24.5c3-1.4 6-1.4 9 0s6 1.4 9 0"
        stroke="#5FD4C4"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* wordmark */}
      <text
        x="30"
        y="22.5"
        fontFamily="'Google Sans Flex', system-ui, sans-serif"
        fontSize="17"
        fontWeight="600"
        letterSpacing="0.4"
        fill="#F1F1F1"
      >
        edu
        <tspan fill="#5FD4C4">boat</tspan>
      </text>
    </svg>
  )
}
