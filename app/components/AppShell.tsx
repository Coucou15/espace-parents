import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </>
  );
}
