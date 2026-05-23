export default function ParentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--surface-muted)]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[var(--background)] shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[url('/logo.jpg')] bg-[length:80%_auto] bg-center bg-no-repeat opacity-[0.12]"
        />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </div>
    </div>
  );
}
