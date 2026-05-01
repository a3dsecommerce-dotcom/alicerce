"use client";
import { useState } from "react";
import AlmoxarifadoModule from "../components/modules/AlmoxarifadoModule";

export default function AlmoxarifadoPage() {
  const [reducao, setReducao] = useState(20);

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto">
        <AlmoxarifadoModule reducao={reducao} setReducao={setReducao} />
      </div>
    </div>
  );
}
