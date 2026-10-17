/** Deep links that open a URL inside a wallet app's own browser (where an injected provider exists). */
export type WalletLink = { id: string; name: string; href: string | null; note?: string };

export function isMobileUserAgent(ua: string, maxTouchPoints = 0): boolean {
  if (/Android|iPhone|iPod|Mobile|Opera Mini|IEMobile/i.test(ua)) return true;
  // iPadOS reports a desktop Safari UA; touch points give it away.
  return /Macintosh/.test(ua) && maxTouchPoints > 1;
}

export function walletDeepLinks(currentUrl: string): WalletLink[] {
  const url = new URL(currentUrl);
  const hostAndPath = `${url.host}${url.pathname}${url.search}`;
  const full = encodeURIComponent(url.toString());
  return [
    { id: "metamask", name: "MetaMask", href: `https://metamask.app.link/dapp/${hostAndPath}` },
    { id: "trust", name: "Trust Wallet", href: `https://link.trustwallet.com/open_url?coin_id=60&url=${full}` },
    // Rabby and Rainbow publish no "open this URL" link: copy it and paste in their in-app browser.
    { id: "rabby", name: "Rabby", href: null, note: "Copy the link, open Rabby, tap Dapps and paste it." },
    { id: "rainbow", name: "Rainbow", href: null, note: "Copy the link, open Rainbow, tap the browser icon and paste it." },
  ];
}
