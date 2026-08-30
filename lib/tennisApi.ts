// Integracja z livetennisapi.com (darmowy plan: 30 req/min, 100 req/dzień).
// WAŻNE OGRANICZENIE darmowego planu: nie ma dostępu do historii zakończonych
// meczów (to jest w płatnym planie Basic). Dlatego rozliczamy mecz na podstawie
// OSTATNIEGO zaobserwowanego wyniku "live" tuż zanim mecz zniknie z listy live/
// przestanie się aktualizować - i oznaczamy go needs_review=true, żeby admin
// mógł to zweryfikować i poprawić jednym kliknięciem w panelu (masz to już
// zaplanowane w wymaganiach - to jest dokładnie ten scenariusz).
//
// Zanim wdrożysz na produkcję: zajrzyj do https://docs.livetennisapi.com i
// dopasuj nazwy pól poniżej (oznaczone komentarzem "SPRAWDŹ W DOKUMENTACJI"),
// bo dokładny kształt JSON-a dla /matches może się różnić od przykładu
// pokazanego na stronie głównej.

const BASE_URL = process.env.TENNIS_API_BASE_URL || 'https://api.livetennisapi.com/api/public/v1';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TENNIS_API_KEY}`,
  };
}

export type ApiMatch = {
  id: string;
  tournament?: string;
  round?: string;
  player1: string;
  player2: string;
  player1_country?: string;
  player2_country?: string;
  scheduled_at?: string;
  status: 'upcoming' | 'live' | 'finished' | string;
};

export type ApiScore = {
  sets: number[]; // np. [1,0] = zaliczone sety: p1 wygrał 1, p2 0 (SPRAWDŹ W DOKUMENTACJI dokładny format)
  games: number[][];
  is_tiebreak: boolean;
  timestamp: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Tennis API error ${res.status} na ${path}: ${await res.text()}`);
  }
  return res.json();
}

// Pobiera aktualnie żywe mecze US Open (darmowy endpoint)
export async function fetchLiveMatches(): Promise<ApiMatch[]> {
  const data = await apiGet<{ matches: ApiMatch[] }>('/matches?status=live');
  return data.matches || [];
}

// Pobiera nadchodzące mecze / fixtures (darmowy endpoint)
export async function fetchUpcomingMatches(): Promise<ApiMatch[]> {
  const data = await apiGet<{ matches: ApiMatch[] }>('/matches?status=upcoming');
  return data.matches || [];
}

// Pobiera aktualny wynik konkretnego meczu (darmowy endpoint)
export async function fetchMatchScore(externalId: string): Promise<ApiScore> {
  return apiGet<ApiScore>(`/matches/${externalId}/score`);
}

// Zamienia surowy wynik setów z API na (sets_p1, sets_p2, winner) używane w naszej bazie.
// SPRAWDŹ W DOKUMENTACJI: to jest interpretacja przykładu z landing page - może wymagać korekty.
export function parseSetsScore(sets: number[]): {
  setsP1: number;
  setsP2: number;
  winner: 'player1' | 'player2' | null;
} {
  const setsP1 = sets[0] ?? 0;
  const setsP2 = sets[1] ?? 0;
  // mecz kobiet best-of-3 -> ktoś ma 2 sety, mecz mężczyzn best-of-5 -> ktoś ma 3 sety
  let winner: 'player1' | 'player2' | null = null;
  if (setsP1 >= 2 && setsP1 > setsP2) winner = 'player1';
  if (setsP2 >= 2 && setsP2 > setsP1) winner = 'player2';
  return { setsP1, setsP2, winner };
}
