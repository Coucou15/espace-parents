/* eslint-disable @next/next/no-img-element */
export function Logo({ size = 48, ring = true }: { size?: number; ring?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-white ${
        ring ? "ring-2 ring-white/40 shadow-md" : ""
      }`}
      style={{ width: size, height: size }}
      aria-label="Logo Les Racines du Future"
    >
      <img
        src="/logo.jpg"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
