'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { createDeck, dealCards, removePairs, shuffle } from '@/lib/gameLogic';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 部屋を作る
  const handleCreate = async () => {
    if (!name.trim()) { setError('名前を入力してください'); return; }
    setLoading(true);
    try {
      const { user } = await signInAnonymously(auth);
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const deck = createDeck();
      const [hand1, hand2] = dealCards(deck);
      const gameRef = await addDoc(collection(db, 'oldMaidGames'), {
        roomCode: code,
        status: 'waiting',
        currentTurn: user.uid,
        winner: null,
        createdAt: Date.now(),
        players: {
          [user.uid]: { name: name.trim(), hand: removePairs(hand1) }
        },
        playerIds: [user.uid],
        hand2: removePairs(shuffle(hand2)),
      });
      localStorage.setItem('oldMaidUid', user.uid);
      localStorage.setItem('oldMaidName', name.trim());
      router.push(`/game/${gameRef.id}`);
    } catch { setError('エラーが発生しました'); }
    finally { setLoading(false); }
  };

  // 部屋に参加する
  const handleJoin = async () => {
    if (!name.trim()) { setError('名前を入力してください'); return; }
    if (!roomCode.trim()) { setError('ルームコードを入力してください'); return; }
    setLoading(true);
    try {
      const { user } = await signInAnonymously(auth);
      const q = query(collection(db, 'oldMaidGames'), where('roomCode', '==', roomCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) { setError('部屋が見つかりません'); setLoading(false); return; }
      const gameDoc = snap.docs[0];
      const data = gameDoc.data();
      if (data.status !== 'waiting') { setError('このゲームはすでに始まっています'); setLoading(false); return; }
      const hostId = data.playerIds[0];
      await import('firebase/firestore').then(({ updateDoc, doc }) =>
        updateDoc(doc(db, 'oldMaidGames', gameDoc.id), {
          [`players.${user.uid}`]: { name: name.trim(), hand: data.hand2 },
          playerIds: [hostId, user.uid],
          status: 'playing',
          hand2: null,
        })
      );
      localStorage.setItem('oldMaidUid', user.uid);
      localStorage.setItem('oldMaidName', name.trim());
      router.push(`/game/${gameDoc.id}`);
    } catch { setError('エラーが発生しました'); }
    finally { setLoading(false); }
  };

  const s = {
    container: { minHeight: '100dvh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32 },
    title: { fontSize: 36, fontWeight: 900, textAlign: 'center' as const },
    card: { background: '#16213e', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column' as const, gap: 12 },
    input: { padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#0f3460', color: '#fff', fontSize: 16, outline: 'none', width: '100%' },
    btn: { padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },
    error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' as const },
  };

  return (
    <div style={s.container}>
      <div style={s.title}>🃏 ババ抜き</div>

      <div style={s.card}>
        <p style={{ fontWeight: 700, fontSize: 18 }}>名前を入力</p>
        <input style={s.input} placeholder="あなたの名前" value={name} onChange={e => setName(e.target.value)} />

        <p style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>部屋を作る</p>
        <button style={{ ...s.btn, background: '#e94560', color: '#fff' }} onClick={handleCreate} disabled={loading}>
          {loading ? '作成中...' : '新しい部屋を作る'}
        </button>

        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>── または ──</div>

        <p style={{ fontWeight: 700, fontSize: 16 }}>部屋に参加する</p>
        <input style={s.input} placeholder="ルームコード（例：ABC123）" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
        <button style={{ ...s.btn, background: '#0f3460', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={handleJoin} disabled={loading}>
          {loading ? '参加中...' : '参加する'}
        </button>

        {error && <p style={s.error}>{error}</p>}
      </div>
    </div>
  );
}
