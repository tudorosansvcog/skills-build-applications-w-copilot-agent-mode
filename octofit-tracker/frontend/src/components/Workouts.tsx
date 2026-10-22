import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';

  return (
    <CapabilityCard<WorkoutsResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
      emptyMessage="No workout suggestions yet."
      isEmpty={({ suggestions }) => suggestions.length === 0}
    >
      {({ suggestions }) => (
        <ul className="list-group list-group-flush">
          {suggestions.map((workout) => (
            <li className="list-group-item px-0" key={workout.title}>
              <strong>{workout.title}</strong>
              {workout.focus && <span> · {workout.focus}</span>}
              {workout.minutes !== undefined && <span> · {workout.minutes} minutes</span>}
              {workout.difficulty && <span> · {workout.difficulty}</span>}
              {workout.reason && <p className="mb-0">{workout.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
