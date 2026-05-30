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

  const s =
