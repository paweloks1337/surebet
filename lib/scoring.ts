// Punktacja (zgodnie ze specyfikacją):
// - dokładny wynik (poprawny zwycięzca ORAZ dokładny wynik meczowy w setach) = 3 pkt
// - trafiony sam zwycięzca (zły wynik w setach) = 1 pkt
// - nietrafiony zwycięzca = 0 pkt
export function calculatePredictionPoints(params: {
  predictedWinner: 'player1' | 'player2';
  predictedSetsP1: number;
  predictedSetsP2: number;
  actualWinner: 'player1' | 'player2';
  actualSetsP1: number;
  actualSetsP2: number;
}): number {
  const {
    predictedWinner,
    predictedSetsP1,
    predictedSetsP2,
    actualWinner,
    actualSetsP1,
    actualSetsP2,
  } = params;

  const winnerCorrect = predictedWinner === actualWinner;
  if (!winnerCorrect) return 0;

  const exactScore =
    predictedSetsP1 === actualSetsP1 && predictedSetsP2 === actualSetsP2;

  return exactScore ? 3 : 1;
}
