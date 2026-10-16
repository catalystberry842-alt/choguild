import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { usePassport } from "@/components/passport/passport-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { MONAD_CHAIN_ID, explorerAddressUrl, monadChainLabel } from "@/lib/passport/chain";
import { shortAddress } from "@/lib/passport/format";
import { endPassportSession, requestNonce, verifySignature } from "@/lib/passport/functions";
import { walletErrorMessage } from "@/lib/passport/wallet-error";
import { isAllowedConnector } from "@/lib/passport/wagmi";
import { isMobileUserAgent, walletDeepLinks } from "@/lib/passport/mobile-wallets";


export function WalletPanel() {
  const { address, isConnected, chainId, status } = useAccount();
  const connectors = useConnectors().filter(isAllowedConnector);
  const { connectAsync, isPending: connecting } = useConnect();
  const { disconnect, isPending: disconnecting } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { signMessageAsync, isPending: signing } = useSignMessage();
  const { sessionAddress, refresh } = usePassport();
  const issue = useServerFn(requestNonce);
  const verify = useServerFn(verifySignature);
  const endSession = useServerFn(endPassportSession);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [providerIds, setProviderIds] = useState<string[] | null>(null);

  const network = monadChainLabel(chainId);
  const onMonad = network.onMonad;
  const explorer = address ? explorerAddressUrl(address) : null;
  const sameWallet =
    Boolean(address && sessionAddress) && address?.toLowerCase() === sessionAddress?.toLowerCase();
  const connectorKey = connectors.map((connector) => connector.uid).join("|");
  const connectorsRef = useRef(connectors);
  connectorsRef.current = connectors;

  useEffect(() => {
    let cancelled = false;
    const current = connectorsRef.current;
    void (async () => {
      const found: string[] = [];
      for (const connector of current) {
        try {
          const provider = await connector.getProvider();
          if (provider) found.push(connector.uid);
        } catch {
          // This connector has no provider in this browser.
        }
      }
      if (!cancelled) setProviderIds(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [connectorKey]);

  const readyConnectors = connectors.filter((connector) => providerIds?.includes(connector.uid));

  async function connect(uid: string) {
    setError(null);
    setMessage(null);
    const connector = connectors.find((item) => item.uid === uid);
    if (!connector) {
      setError("That wallet is no longer available. Reload and try again.");
      return;
    }
    try {
      await connectAsync({ connector });
    } catch (caught) {
      setError(walletErrorMessage(caught, "connect"));
    }
  }

  async function copyAddress(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The address could not be copied from this browser.");
    }
  }

  async function switchToMonad() {
    setError(null);
    try {
      await switchChainAsync({ chainId: MONAD_CHAIN_ID });
    } catch (caught) {
      setError(walletErrorMessage(caught, "switch"));
    }
  }

  async function verifyWallet() {
    if (!address || !chainId) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const issued = await issue({ data: { address, chainId } });
      if ("error" in issued) {
        setError(issued.error);
        return;
      }
      const signature = await signMessageAsync({ message: issued.message });
      const result = await verify({ data: { message: issued.message, signature } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refresh();
      setMessage("Wallet verified for this browser session. This does not prove a human identity.");
    } catch (caught) {
      setError(walletErrorMessage(caught, "sign"));
    } finally {
      setBusy(false);
    }
  }

  async function endPassport() {
    setError(null);
    setBusy(true);
    try {
      await endSession();
      await refresh();
      setMessage("Signed out. Your passport is still saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The session could not be ended.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {isConnected && address ? (
          <>
            <p className="text-base font-medium text-ink">{shortAddress(address)}</p>
            <Badge tone={onMonad ? "olive" : "warning"}>{isConnected ? network.label : "Not connected"}</Badge>
          </>
        ) : (
          <p className="text-base text-body">No wallet connected</p>
        )}
        {sessionAddress ? <Badge tone="sand">Session {shortAddress(sessionAddress)}</Badge> : null}
      </div>

      <p className="t-meta">Choguild never asks for your seed phrase or private key.</p>

      {isConnected && !onMonad ? (
        <p className="text-base text-warning">
          Your wallet is on {network.label}. Switch to Monad (chain {MONAD_CHAIN_ID}) to continue.
        </p>
      ) : null}
      {sessionAddress && address && !sameWallet ? (
        <p className="text-base text-warning">
          You're signed in as {shortAddress(sessionAddress)}, not this wallet. Verify to switch, and each passport stays on its own address.
        </p>
      ) : null}

      {!isConnected ? (
        providerIds === null ? (
          <p className="text-base text-body">Checking for a wallet…</p>
        ) : readyConnectors.length > 0 ? (
          <div className="flex flex-col gap-2">
            {readyConnectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => void connect(connector.uid)}
                disabled={connecting || status === "connecting" || status === "reconnecting"}
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        ) : (
          isMobileUserAgent(navigator.userAgent, navigator.maxTouchPoints) ? (
            <MobileWalletLinks />
          ) : (
            <ErrorMessage title="No wallet found">
              Install a browser wallet such as MetaMask or Rabby, then reload this page.
            </ErrorMessage>
          )
        )
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void copyAddress(address!)}>
            {copied ? "Copied" : "Copy address"}
          </Button>
          {explorer ? (
            <a className="t-link inline-flex min-h-11 items-center text-base" href={explorer} target="_blank" rel="noreferrer">
              Explorer
            </a>
          ) : null}
          <Button variant="secondary" onClick={() => disconnect()} disabled={disconnecting}>
            Disconnect
          </Button>
          {!onMonad ? (
            <Button variant="secondary" onClick={() => void switchToMonad()} disabled={switching}>
              Switch to Monad
            </Button>
          ) : null}
        </div>
      )}

      {isConnected && onMonad && !sameWallet ? (
        <div className="flex flex-col gap-2">
          <p className="t-meta">You'll sign a free message to prove you own this wallet. It isn't a transaction.</p>
          <Button onClick={() => void verifyWallet()} disabled={busy || signing}>
            {busy || signing ? "Waiting for signature" : "Verify this wallet"}
          </Button>
        </div>
      ) : null}

      {sessionAddress ? (
        <Button variant="ghost" onClick={() => void endPassport()} disabled={busy}>
          End passport session
        </Button>
      ) : null}

      {message ? <p className="text-base text-body">{message}</p> : null}
      {error ? <ErrorMessage title="Wallet">{error}</ErrorMessage> : null}
    </div>
  );
}

/** Phones have no injected wallet in Safari/Chrome: open this page inside a wallet app's browser instead. */
function MobileWalletLinks() {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const links = walletDeepLinks(url);
  return (
    <div className="flex flex-col gap-3" data-testid="mobile-wallet-links">
      <p className="text-base text-body">
        Phone browsers can't reach a wallet directly. Open this page inside your wallet app to sign in.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {links.filter((link) => link.href).map((link) => (
          <Button key={link.id} asChild variant="secondary">
            <a href={link.href!}>Open in {link.name}</a>
          </Button>
        ))}
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => undefined);
        }}
      >
        {copied ? "Link copied" : "Copy link for Rabby or Rainbow"}
      </Button>
      <p className="t-meta">
        {links.filter((link) => !link.href).map((link) => link.note).join(" ")}
      </p>
    </div>
  );
}
