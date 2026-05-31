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
  const [message, setMessage] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('oldMaidUid') || '';
    setMyId(uid);
    const unsub = onSnapshot(doc(db, 'oldMaidGames', id), snap => {
      if (snap.exists()) setGame(snap.data() as GameState);
    });
    return () => unsub();
  }, [id]);

  if (!game) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}>
      読み込み中...
    </div>
  );

  const opponentId = game.playerIds.find(pid => pid !== myId) || '';
  const myPlayer = game.players[myId];
  const opponent = game.players[opponentId];
  const isMyTurn = game.currentTurn === myId;
  const opponentHandShuffled = opponent?.hand ? shuffle([...opponent.hand]) : [];

  const drawCard = async (index: number) => {
    if (!isMyTurn || game.status !== 'playing') return;
    const actualCard = opponent.hand[index];
    const newMyHandBeforePair = [...myPlayer.hand, actualCard];
    const newMyHand = removePairs(newMyHandBeforePair);
    const newOpponentHand = shuffle(opponent.hand.filter((_, i) => i !== index));
    setMessage(`引いたカード：${getCardLabel(actualCard)}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let newStatus: 'waiting' | 'playing' | 'finished' = game.status;
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
    setMessage('');
  };

  // 終了画面
  if (game.status === 'finished') {
    const iWon = game.winner === myId;
    return (
      <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div style={{ fontSize:80 }}>{iWon ? '🎉' : '😢'}</div>
        <div style={{ fontSize:32, fontWeight:900 }}>{iWon ? 'あなたの勝ち！' : 'あなたの負け...'}</div>
        <button onClick={() => window.location.href = '/'} style={{ marginTop:24, padding:'14px 32px', borderRadius:12, border:'none', background:'#e94560', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer' }}>
          ホームに戻る
        </button>
      </div>
    );
  }

  // 待機画面
  if (game.status === 'waiting') {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:24 }}>
        <div style={{ fontSize:48 }}>⏳</div>
        <p style={{ fontSize:20, fontWeight:700 }}>対戦相手を待っています...</p>
        <div style={{ background:'#16213e', borderRadius:16, padding:24, textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.6)', marginBottom:8 }}>ルームコードを相手に教えてください</p>
          <p style={{ fontSize:36, fontWeight:900, letterSpacing:'0.2em', color:'#ffd700' }}>{game.roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', padding:16, gap:12, maxWidth:480, margin:'0 auto' }}>

      {/* ターン表示 */}
      <div style={{ background:isMyTurn?'#1a3a1a':'#3a1a1a', borderRadius:12, padding:'12px 16px', textAlign:'center' }}>
        <p style={{ fontWeight:700, fontSize:16 }}>
          {isMyTurn ? '🟢 あなたのターン' : `🔴 ${opponent?.name ?? '相手'}のターン`}
        </p>
        {message && <p style={{ fontSize:13, color:'#ffd700', marginTop:4 }}>{message}</p>}
      </div>

      {/* 相手の手札（裏向き） */}
      <div style={{ background:'#16213e', borderRadius:12, padding:16 }}>
        <p style={{ marginBottom:12, fontWeight:700 }}>
          {opponent?.name ?? '相手'} の手札（{opponent?.hand?.length ?? 0}枚）
        </p>
        {isMyTurn && <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>カードをタップして引く</p>}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {opponentHandShuffled.map((_, i) => (
            <button key={i} onClick={() => drawCard(i)}
              style={{ width:52, height:72, borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'linear-gradient(135deg,#1a1a4e,#0f3460)', cursor:isMyTurn?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff' }}>
              🂠
            </button>
          ))}
        </div>
      </div>

      {/* 自分の手札 */}
      <div style={{ background:'#16213e', borderRadius:12, padding:16 }}>
        <p style={{ marginBottom:12, fontWeight:700 }}>
          あなたの手札（{myPlayer?.hand?.length ?? 0}枚）
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {myPlayer?.hand?.map((card, i) => (
            <div key={i} style={{ width:52, height:72, borderRadius:8, border:`1px solid ${card===52?'#ffd700':'rgba(255,255,255,0.3)'}`, background:card===52?'#3a3a00':'#0f3460', color:isRed(card)?'#ff6b6b':'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {getCardLabel(card)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
