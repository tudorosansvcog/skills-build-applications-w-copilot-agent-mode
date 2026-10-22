import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { type: string; minutes: number; points: number; occurredAt?: string };
type ActivitiesResponse = { activities: ActivityItem[] };

export default function Activities() {
  return (
    <CapabilityCard<ActivitiesResponse>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
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
