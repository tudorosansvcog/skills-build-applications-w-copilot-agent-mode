# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Plan recorded before implementation:

- Presentation tier decision: Keep React views responsible for presentation and interaction, and use the shared API client for all requests. Each capability view will expose accessible loading, error, empty, and populated states; the browser will continue using relative `/api` paths through the Vite proxy.
- Logic tier decision: Keep Express route handlers thin and place request validation and domain behavior in the service layer. Return deliberate 4xx responses for invalid input, malformed or missing references, and unknown users; do not let Mongoose cast errors become 500 responses.
- Data tier decision: Define required fields, references, defaults, and validation in Mongoose models. Keep seed data representative and idempotent, updating only known seeded records and preserving unrelated records.
- Activity tracking approach: Validate the submitted user and team IDs and confirm both records exist before creating an activity. Persist the references, type, and minutes with centrally computed points and an occurrence date; invalid requests must not create records.
- Team management approach: Require a team name, retain its submitted name and mascot, and maintain valid member references. Team creation and listing should expose the expected member IDs without moving presentation or persistence logic into routes.
- Leaderboard approach: Aggregate activity points by team, sort by total points descending, and return each team name, total, and 1-based rank.
- Workout suggestions approach: Find the user by email, consider their fitness goal and recent activity, then rank matching workouts deterministically and explain the first recommendation with a reason. Return a deliberate 4xx response when no user matches.

Implementation order: complete and verify the models and additive seed first; implement service behavior and API routes against those data contracts next; then connect the frontend views through the shared client and implement their accessible states. This keeps each tier testable before its dependents are built.

## Test plan

Record the commands you run and what each failure means. Baseline results below were collected before implementation; contract failures identify unfinished behavior rather than build/type errors.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — baseline: 4 of 5 tests fail because required model validation is missing for users, teams, activities, and workouts; idempotent seeding passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` — baseline: all 4 tests fail. Activity/team creation returns placeholder 501 responses instead of validating requests, the leaderboard is empty, and workout suggestions do not provide the expected reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — baseline: all 15 tests fail. Views do not yet render API data or meet loading, empty, and accessible error-state expectations.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — baseline passes TypeScript compilation; passing this does not establish contract behavior.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — baseline passes type checking and the production Vite build; passing this does not establish view behavior.
