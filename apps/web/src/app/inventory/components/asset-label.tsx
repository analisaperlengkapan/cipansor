"use client";

import { QRCodeSVG } from "qrcode.react";
import { Asset } from "@/hooks/use-inventory";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface AssetLabelProps {
  asset: Asset;
}

export function AssetLabel({ asset }: AssetLabelProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handlePrint()}>
        <Printer className="mr-2 h-4 w-4" /> Print Label
      </Button>

      <div style={{ display: "none" }}>
        <div ref={componentRef} className="p-4 print:block">
          <div className="border-2 border-black rounded-lg p-2 w-[300px] flex items-center gap-4">
            <div className="flex-shrink-0">
              <QRCodeSVG value={asset.code} size={80} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-sm uppercase truncate">
                {asset.unit?.name || "Cipansor"}
              </h3>
              <p className="text-xs text-gray-600 truncate">{asset.name}</p>
              <p className="font-mono text-lg font-bold mt-1">{asset.code}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
