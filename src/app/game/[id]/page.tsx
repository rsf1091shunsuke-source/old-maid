'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCardLabel, isRed, removePairs, shuffle } from '@/lib/gameLogic';

interface Player { name: string; hand: number[]; }
interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: string;
  winner: string | null;
  playerIds: string[];
  players: Record<string, Player>;
  roomCode: string;
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameState | null>(null);
  const [myId, setMyId] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('oldMaidUid') || '';
    setMyId(uid);
    const unsub = onSnapshot(doc(db, 'oldMaidGames', id), snap => {
      if (snap.exists()) setGame(snap.data() as GameState);
    });
    return () => unsub();
  }, [id]);

  if (!game) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}>読み込み中...</div>;

  const opponentId = game.playerIds.find(pid => pid !== myId) || '';
  const myPlayer = game.players[myId];
  const opponent = game.players[opponentId];
  const isMyTurn = game.currentTurn === myId;
  const opponentHand = opponent?.hand ? shuffle([...opponent.hand]) : [];

  // カードを引く
  const drawCard = async (index: number) => {
    if (!isMyTurn || game.status !== 'playing') return;
    if (selected === null) { setSelected(index); return; }
    const actualCard = opponent.hand[index];
    const newMyHand = removePairs([...myPlayer.hand, actualCard]);
    const newOpponentHand = opponent.hand.filter((_, i) => i !== index);

    let newStatus = game.status;
    let winner = game.winner;

    if (newMyHand.length === 0) { newStatus = 'finished'; winner = myId; }
    else if (newOpponentHand.length === 0) { newStatus = 'finished'; winner = opponentId; }

    await updateDoc(doc(db, 'oldMaidGames', id), {
      [`players.${myId}.hand`]: newMyHand,
      [`players.${opponentId}.hand`]: newOpponentHand,
      currentTurn: opponentId,
      status: newStatus,
      winner,
    });
    setSelected(null);
    setMessage('カードを引きました！');
    setTimeout(() => setMessage(''), 2000);
  };

  const s = {
    page: { minHeight: '100dvh', display: 'flex', flexDirection: 'column' as const, padding: 16, gap: 16, maxWidth: 480, margin: '0 auto' },
    section: { background: '#16213e', borderRadius: 16, padding: 16 },
    cardBtn: (red: boolean, selected: boolean) => ({
      width: 52, height: 72, borderRadius: 8, border: selected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.3)',
      background: '#0f3460', color: red ? '#ff6b6b' : '#fff', fontSize: 11, fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const,
    }),
    faceDown: (sel: boolean) => ({
      width: 52, height: 72, borderRadius: 8, border: sel ? '3px solid #ffd700' : '1px solid rgba(255,255,255,0.3)',
      background: 'linear-gradient(135deg, #1a1a4e, #0f3460)', cursor: 'pointer',
      display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: 24,
    }),
  };

  // 終了画面
  if (game.status === 'finished') {
    const iWon = game.winner === myId;
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 80 }}>{iWon ? '🎉' : '😢'}</div>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{iWon ? 'あなたの勝ち！' : 'あなたの負け...'}</div>
        <button onClick={() => window.location.href = '/'} style={{ marginTop: 24, padding: '14px 32px', borderRadius: 12, border: 'none', background: '#e94560', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          ホームに戻る
        </button>
      </div>
    );
  }

  // 待機画面
  if (game.status === 'waiting') {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <p style={{ fontSize: 20, fontWeight: 700 }}>対戦相手を待っています...</p>
        <div style={{ background: '#16213e', borderRadius: 16, padding: 24, textAlign: 'center' as const }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>ルームコードを相手に教えてください</p>
          <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '0.2em', color: '#ffd700' }}>{game.roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* ターン表示 */}
      <div style={{ ...s.section, textAlign: 'center' as const, background: isMyTurn ? '#1a3a1a' : '#3a1a1a' }}>
        <p style={{ fontWeight: 700, fontSize: 16 }}>
          {isMyTurn ? '🟢 あなたのターン' : `🔴 ${opponent?.name ?? '相手'}のターン`}
        </p>
        {message && <p style={{ fontSize: 13, color: '#ffd700', marginTop: 4 }}>{message}</p>}
      </div>

      {/* 相手の手札（裏向き） */}
      <div style={s.section}>
        <p style={{ marginBottom: 12, fontWeight: 700 }}>
          {opponent?.name ?? '相手'} の手札（{opponent?.hand?.length ?? 0}枚）
        </p>
        {isMyTurn && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>カードをタップして引く</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {opponentHand.map((_, i) => (
            <button key={i} style={s.faceDown(selected === i)} onClick={() => drawCard(i)}>
              🂠
            </button>
          ))}
        </div>
      </div>

      {/* 自分の手札 */}
      <div style={s.section}>
        <p style={{ marginBottom: 12, fontWeight: 700 }}>
          あなたの手札（{myPlayer?.hand?.length ?? 0}枚）
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {myPlayer?.hand?.map((card, i) => (
            <div key={i} style={s.cardBtn(isRed(card), false)}>
              {getCardLabel(card)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
