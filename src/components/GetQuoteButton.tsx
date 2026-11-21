"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useQuoteModal } from "./QuoteModalProvider";

type GetQuoteButtonProps = {
  className?: string;
  service?: string;
  onOpen?: () => void;
  children: ReactNode;
};

export function GetQuoteButton({
  className,
  service,
  onOpen,
  children,
}: GetQuoteButtonProps) {
  const router = useRouter();
  const modal = useQuoteModal();

  function handleClick() {
    onOpen?.();
    if (modal) {
      modal.openQuoteModal(service ? { service } : undefined);
    } else {
      router.push("/estimate");
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
