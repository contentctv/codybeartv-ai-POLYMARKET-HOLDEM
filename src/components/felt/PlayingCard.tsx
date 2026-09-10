import { RANK_LABEL, SUIT_GLYPH, isRed } from "@/lib/holdem/cards";
import type { Card } from "@/lib/holdem/types";
import { cn } from "@/lib/utils";

export function PlayingCard({ card, hidden }: { card?: Card | null; hidden?: boolean }) {
  if (!card || hidden) {
    return <div className="playing-card back" aria-label="Facedown card" />;
  }
  const red = isRed(card.suit);
  return (
    <div className={cn("playing-card", red && "red")} aria-label={`${RANK_LABEL[card.rank]} of ${card.suit}`}>
      <span>
        {RANK_LABEL[card.rank]}
        {SUIT_GLYPH[card.suit]}
      </span>
      <span className="self-end text-base">{SUIT_GLYPH[card.suit]}</span>
    </div>
  );
}
