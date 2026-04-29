import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useSupabaseSession } from "./use-supabase-session";

export type InventoryAccessLevel = "admin" | "consulta";

type AccessControlValue = {
  session: Session | null;
  loading: boolean;
  accessLevel: InventoryAccessLevel;
  canManageInventory: boolean;
};

const AccessControlContext = createContext<AccessControlValue | null>(null);

function resolveAccessLevel(session: Session | null): InventoryAccessLevel {
  const rawLevel =
    session?.user?.app_metadata?.access_level ?? session?.user?.user_metadata?.access_level;

  if (rawLevel === "consulta" || rawLevel === "viewer" || rawLevel === "readonly") {
    return "consulta";
  }

  return "admin";
}

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useSupabaseSession();

  const value = useMemo<AccessControlValue>(
    () => {
      const accessLevel = resolveAccessLevel(session);

      return {
        session,
        loading,
        accessLevel,
        canManageInventory: accessLevel === "admin",
      };
    },
    [loading, session],
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const ctx = useContext(AccessControlContext);
  if (!ctx) {
    throw new Error("useAccessControl must be used inside AccessControlProvider");
  }
  return ctx;
}
