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
  return Math.floor(card / 13) === 1 || Math.floor(card / 13) === 2;
}

// デッキを作る（0〜52の53枚）
export function createDeck(): number[] {
  return Array.from({ length: 53 }, (_, i) => i);
}

// シャッフルする
export function shuffle(cards: number[]): number[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 2人に配る
export function dealCards(deck: number[]): [number[], number[]] {
  const shuffled = shuffle(deck);
  const mid = Math.ceil(shuffled.length / 2);
  return [shuffled.slice(0, mid), shuffled.slice(mid)];
}

// 手札からペアを取り除く
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
