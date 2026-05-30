const drawCard = async (index: number) => {
  if (!isMyTurn || game.status !== 'playing') return;
  const actualCard = opponent.hand[index];
  const newMyHandBeforePair = [...myPlayer.hand, actualCard];
  const newMyHand = removePairs(newMyHandBeforePair);
  const newOpponentHand = opponent.hand.filter((_, i) => i !== index);

  // ✅ 引いたカードを表示
  setMessage(`引いたカード：${getCardLabel(actualCard)}`);

  // ✅ 1.5秒待ってからFirestoreを更新
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
  setSelected(null);
  setMessage('');
};
