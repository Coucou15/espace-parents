"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type Compte } from "../lib/auth";

export function AuthGuard({ children }: { children: (compte: Compte) => React.ReactNode }) {
  const router = useRouter();
  const [compte, setCompte] = useState<Compte | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCompte(user);
      }
      setChecked(true);
    });
  }, [router]);

  if (!checked || !compte) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]">
        Chargement…
      </div>
    );
  }
  return <>{children(compte)}</>;
}
