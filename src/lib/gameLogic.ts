export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const SUITS = ['\u2660','\u2665','\u2666','\u2663'];
export const JOKER = 52;

export function getCardLabel(card: number): string {
  if (card === JOKER) return '\u{1F0CF}';
  const suit = SUITS[Math.floor(card / 13)];
  const rank = RANKS[card % 13];
  return `${suit}${rank}`;
}

export function getCardRank(card: number): number {
  if (card === JOKER) return -1;
  return card % 13;
}

export function isRed(card: number): boolean {
  if (card === JOKER) return true;
  const suit = Math.floor(card / 13);
  return suit === 1 || suit === 2;
}

export function createDeck(): number[] {
  return Array.from({ length: 53 }, (_, i) => i);
}

export function shuffle(cards: number[]): number[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dealCards(deck: number[]): [number[], number[]] {
  const shuffled = shuffle(deck);
  const mid = Math.ceil(shuffled.length / 2);
  return [shuffled.slice(0, mid), shuffled.slice(mid)];
}

export function removePairs(hand: number[]): number[] {
  const result = [...hand];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === JOKER) continue;
      for (let j = i + 1; j < result.length; j++) {
        if (result[j] === JOKER) continue;
        if (getCardRank(result[i]) === getCardRank(result[j])) {
          result.splice(j, 1);
          result.splice(i, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return result;
}
