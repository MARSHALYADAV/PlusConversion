import React from "https://esm.sh/react@18";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <h1 className="logo"><i data-lucide="refresh-cw"></i> PlusConversion</h1>
        <p className="tagline">Simple. Fast. Free File Conversion.</p>
      </div>
    </header>
  );
}
