import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };
const loadLeaderboard = () => getJson<LeaderboardResponse>('/api/leaderboard');

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      load={loadLeaderboard}
      emptyMessage="No leaderboard scores yet."
      isEmpty={({ leaderboard }) => leaderboard.length === 0}
    >
      {({ leaderboard }) => (
        <ol className="list-group list-group-numbered list-group-flush">
          {leaderboard.map((entry) => (
            <li className="list-group-item px-0" key={entry.teamName}>
              <strong>{entry.teamName}</strong> · {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
