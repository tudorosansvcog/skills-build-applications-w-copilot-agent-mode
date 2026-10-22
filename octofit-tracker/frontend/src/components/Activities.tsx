import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { type: string; minutes: number; points: number; occurredAt?: string };
type ActivitiesResponse = { activities: ActivityItem[] };
const loadActivities = () => getJson<ActivitiesResponse>('/api/activities');

export default function Activities() {
  return (
    <CapabilityCard<ActivitiesResponse>
      title="Activities"
      description="Track student activity minutes and points."
      load={loadActivities}
      emptyMessage="No activities yet."
      isEmpty={({ activities }) => activities.length === 0}
    >
      {({ activities }) => (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li className="list-group-item px-0" key={`${activity.type}-${activity.occurredAt ?? index}`}>
              <strong>{activity.type}</strong> {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
