export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const SUITS = ['♠','♥','♦','♣'];
export const JOKER = 52;

// カードの見た目を返す（例：♠A、♥K、🃏）
export function getCardLabel(card: number): string {
  if (card === JOKER) return '🃏';
  const suit = SUITS[Math.floor(card / 13)];
  const rank = RANKS[card % 13];
  return `${suit}${rank}`;
}

// カードの数字だけを返す（ペア判定に使う）
export function getCardRank(card: number): number {
  if (card === JOKER) return -1;
  return card % 13;
}

// カードが赤かどうか（♥♦は赤）
export function isRed(card: number): boolean {
  if (card === JOKER) return true;
  return Math.floor(card / 13) === 1 || Math.
