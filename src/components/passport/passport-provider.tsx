import { useServerFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getPassportState } from "@/lib/passport/functions";
import { WalletStateProvider } from "@/components/passport/wallet-state";
import type { PublicProfile } from "@/lib/passport/types";

type PassportContextValue = {
  status: "loading" | "ready" | "error";
  sessionAddress: string | null;
  profile: PublicProfile | null;
  error: string | null;
  refresh: () => Promise<void>;
};

const PassportContext = createContext<PassportContextValue | null>(null);

export function PassportProvider({ children }: { children: ReactNode }) {
  return (
    <WalletStateProvider>
      <PassportState>{children}</PassportState>
    </WalletStateProvider>
  );
}

function PassportState({ children }: { children: ReactNode }) {
  const load = useServerFn(getPassportState);
  const [status, setStatus] = useState<PassportContextValue["status"]>("loading");
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await load();
      setSessionAddress(next.sessionAddress);
      setProfile(next.profile);
      setError(null);
      setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The passport session could not be loaded.");
      setStatus("error");
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, sessionAddress, profile, error, refresh }),
    [status, sessionAddress, profile, error, refresh],
  );

  return <PassportContext.Provider value={value}>{children}</PassportContext.Provider>;
}

// Shares this file's context. A second module would only exist to quiet the refresh rule.
// eslint-disable-next-line react-refresh/only-export-components
export function usePassport() {
  const value = useContext(PassportContext);
  if (!value) throw new Error("usePassport must be used inside PassportProvider");
  return value;
}
