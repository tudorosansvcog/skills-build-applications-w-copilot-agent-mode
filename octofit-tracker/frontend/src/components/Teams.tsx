import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { name: string; mascot?: string; members?: string[] };
type TeamsResponse = { teams: TeamItem[] };
const loadTeams = () => getJson<TeamsResponse>('/api/teams');

export default function Teams() {
  return (
    <CapabilityCard<TeamsResponse>
      title="Teams"
      description="Manage teams and members."
      load={loadTeams}
      emptyMessage="No teams yet."
      isEmpty={({ teams }) => teams.length === 0}
    >
      {({ teams }) => (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li className="list-group-item px-0" key={team.name}>
              <strong>{team.name}</strong>
              {team.mascot && <span> · Mascot: {team.mascot}</span>}
              {team.members?.length ? <span> · Members: {team.members.join(', ')}</span> : <span> · No members</span>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
