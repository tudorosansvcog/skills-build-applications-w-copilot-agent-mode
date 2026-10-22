import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !/^[a-f\d]{24}$/i.test(userId)) {
    throw httpError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !/^[a-f\d]{24}$/i.test(teamId)) {
    throw httpError(400, 'A valid teamId is required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw httpError(400, 'An activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  const members = input.members ?? [];
  if (!name) throw httpError(400, 'A team name is required');
  if (!mascot) throw httpError(400, 'A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member))) {
    throw httpError(400, 'Members must be an array of valid user IDs');
  }

  const memberIds = [...new Set(members as string[])];
  const users = memberIds.length ? await User.find({ _id: { $in: memberIds } }).select('_id team') : [];
  if (users.length !== memberIds.length) throw httpError(404, 'One or more team members were not found');

  const team = await Team.create({ name, mascot, members: users.map((user) => user._id) });
  await Promise.all(users.map(async (user) => {
    if (user.team && user.team.toString() !== team._id.toString()) {
      await Team.updateOne({ _id: user.team }, { $pull: { members: user._id } });
    }
  }));
  if (users.length) {
    await User.updateMany({ _id: { $in: users.map((user) => user._id) } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(normalized)) {
    return 'endurance';
  }
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = new Map<string, string>();
  for (const activity of activities) {
    const focus = focusForActivity(activity.type);
    if (!recentFocus.has(focus)) recentFocus.set(focus, activity.type);
  }

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivity = recentFocus.get(focus);
      const reason = matchesGoal && matchingActivity
        ? `Matches your ${user.fitnessGoal} goal and recent ${matchingActivity} activity.`
        : matchesGoal
          ? `Matches your ${user.fitnessGoal} fitness goal.`
          : matchingActivity
            ? `Builds on your recent ${matchingActivity} activity.`
            : `Recommended to complement your recent activity and ${user.fitnessGoal} goal.`;
      return { ...workout, reason, score: Number(matchesGoal) * 2 + Number(Boolean(matchingActivity)) };
    })
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
