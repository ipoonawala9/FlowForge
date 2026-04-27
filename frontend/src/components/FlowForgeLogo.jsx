function FlowForgeLogo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* background */}
      <rect width="32" height="32" rx="8" fill="url(#grad)" />

      {/* flow lines */}
      <line x1="8" y1="10" x2="16" y2="16" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="16" y1="16" x2="24" y2="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="16" y1="16" x2="16" y2="24" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />

      {/* nodes */}
      <circle cx="8"  cy="10" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="10" r="3" fill="white" fillOpacity="0.6" />
      <circle cx="16" cy="16" r="3.5" fill="white" />
      <circle cx="16" cy="24" r="2.5" fill="white" fillOpacity="0.7" />

      {/* center dot accent */}
      <circle cx="16" cy="16" r="1.2" fill="#6366f1" />

      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default FlowForgeLogo;
