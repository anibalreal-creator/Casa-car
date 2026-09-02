import { requireUser } from '../../../../lib/auth';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { isOwnerEmail } from '../../../../lib/owner';

const OWNER_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AUTH_USERS_PER_PAGE = 1000;
const AUTH_USERS_MAX_PAGES = 50;

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: OWNER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function monthKey(value) {
  return dateKey(value).slice(0, 7);
}

function buildDayKeys(now, length = 30) {
  return Array.from({ length }, (_, index) => dateKey(new Date(now.getTime() - index * MS_PER_DAY))).reverse();
}

function buildMonthKeys(now, length = 12) {
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15));
  return Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - index, 15));
    return monthKey(date);
  }).reverse();
}

function countUserDateField(users, field, now) {
  const todayKey = dateKey(now);
  const currentMonthKey = monthKey(now);
  const sevenDaysAgo = now.getTime() - 6 * MS_PER_DAY;
  const thirtyDaysAgo = now.getTime() - 29 * MS_PER_DAY;
  let today = 0;
  let thisMonth = 0;
  let last7Days = 0;
  let last30Days = 0;

  users.forEach((authUser) => {
    const raw = authUser?.[field];
    const date = raw ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const day = dateKey(date);
    const month = day.slice(0, 7);
    const time = date.getTime();
    if (day === todayKey) today += 1;
    if (month === currentMonthKey) thisMonth += 1;
    if (time >= sevenDaysAgo) last7Days += 1;
    if (time >= thirtyDaysAgo) last30Days += 1;
  });

  return { today, thisMonth, last7Days, last30Days };
}

function buildPresenceSeries(rows = [], now) {
  const dayKeys = buildDayKeys(now, 30);
  const monthKeys = buildMonthKeys(now, 12);
  const dailyVisitors = Object.fromEntries(dayKeys.map((key) => [key, new Set()]));
  const dailyUsers = Object.fromEntries(dayKeys.map((key) => [key, new Set()]));
  const monthlyVisitors = Object.fromEntries(monthKeys.map((key) => [key, new Set()]));
  const monthlyUsers = Object.fromEntries(monthKeys.map((key) => [key, new Set()]));

  rows.forEach((row) => {
    const rawDate = row?.last_seen_at;
    if (!rawDate) return;
    const day = dateKey(rawDate);
    const month = day.slice(0, 7);
    const visitorKey = row?.session_key || row?.user_id;
    const userKey = row?.user_id;

    if (visitorKey && dailyVisitors[day]) dailyVisitors[day].add(visitorKey);
    if (userKey && dailyUsers[day]) dailyUsers[day].add(userKey);
    if (visitorKey && monthlyVisitors[month]) monthlyVisitors[month].add(visitorKey);
    if (userKey && monthlyUsers[month]) monthlyUsers[month].add(userKey);
  });

  return {
    dailyLast30: dayKeys.map((day) => ({
      day,
      visitors: dailyVisitors[day]?.size || 0,
      users: dailyUsers[day]?.size || 0,
    })),
    monthlyLast12: monthKeys.map((month) => ({
      month,
      visitors: monthlyVisitors[month]?.size || 0,
      users: monthlyUsers[month]?.size || 0,
    })),
  };
}

function buildSearchStats(rows = [], now) {
  const dayKeys = buildDayKeys(now, 30);
  const monthKeys = buildMonthKeys(now, 12);
  const daily = Object.fromEntries(dayKeys.map((key) => [key, { attempts: 0, completed: 0 }]));
  const monthly = Object.fromEntries(monthKeys.map((key) => [key, { attempts: 0, completed: 0 }]));

  rows.forEach((row) => {
    const day = dateKey(row?.created_at);
    if (!day) return;
    const month = day.slice(0, 7);
    const key = row?.event_name === 'search_completed' ? 'completed' : 'attempts';
    if (daily[day]) daily[day][key] += 1;
    if (monthly[month]) monthly[month][key] += 1;
  });

  const since = (days) => {
    const allowed = new Set(buildDayKeys(now, days));
    return rows.filter((row) => allowed.has(dateKey(row?.created_at)));
  };
  const summarize = (list) => ({
    attempts: list.filter((row) => row.event_name === 'search_registration_gate').length,
    completed: list.filter((row) => row.event_name === 'search_completed').length,
  });

  return {
    today: summarize(rows.filter((row) => dateKey(row?.created_at) === dateKey(now))),
    last7Days: summarize(since(7)),
    last30Days: summarize(since(30)),
    dailyLast30: dayKeys.map((day) => ({ day, ...daily[day] })),
    monthlyLast12: monthKeys.map((month) => ({ month, ...monthly[month] })),
  };
}

function maskEmail(email = '') {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return '';
  const visible = name.length <= 2 ? name[0] || '' : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${visible}@${domain}`;
}

async function listAuthUsers(supabase) {
  const users = [];

  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: AUTH_USERS_PER_PAGE });
    if (error) throw error;
    const batch = Array.isArray(data?.users) ? data.users : [];
    users.push(...batch);
    if (batch.length < AUTH_USERS_PER_PAGE) break;
  }

  return users;
}

async function getRegistrationStats(supabase, now) {
  const users = await listAuthUsers(supabase);
  const todayKey = dateKey(now);
  const currentMonthKey = monthKey(now);
  const sevenDaysAgo = now.getTime() - 6 * MS_PER_DAY;
  const thirtyDaysAgo = now.getTime() - 29 * MS_PER_DAY;
  const dayKeys = buildDayKeys(now, 30);
  const monthKeys = buildMonthKeys(now, 12);
  const dailyMap = Object.fromEntries(dayKeys.map((key) => [key, 0]));
  const monthlyMap = Object.fromEntries(monthKeys.map((key) => [key, 0]));

  let today = 0;
  let thisMonth = 0;
  let last7Days = 0;
  let last30Days = 0;
  let confirmed = 0;

  users.forEach((authUser) => {
    const createdAt = authUser?.created_at ? new Date(authUser.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return;

    const day = dateKey(createdAt);
    const month = day.slice(0, 7);
    const createdTime = createdAt.getTime();

    if (day === todayKey) today += 1;
    if (month === currentMonthKey) thisMonth += 1;
    if (createdTime >= sevenDaysAgo) last7Days += 1;
    if (createdTime >= thirtyDaysAgo) last30Days += 1;
    if (authUser.email_confirmed_at || authUser.confirmed_at) confirmed += 1;
    if (Object.prototype.hasOwnProperty.call(dailyMap, day)) dailyMap[day] += 1;
    if (Object.prototype.hasOwnProperty.call(monthlyMap, month)) monthlyMap[month] += 1;
  });

  const recent = [...users]
    .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
    .slice(0, 10)
    .map((authUser) => ({
      id: authUser.id,
      email: maskEmail(authUser.email),
      created_at: authUser.created_at,
      confirmed: Boolean(authUser.email_confirmed_at || authUser.confirmed_at),
      provider: authUser.app_metadata?.provider || 'email',
    }));

  return {
    total: users.length,
    confirmed,
    unconfirmed: Math.max(users.length - confirmed, 0),
    today,
    thisMonth,
    last7Days,
    last30Days,
    logins: countUserDateField(users, 'last_sign_in_at', now),
    dailyLast30: dayKeys.map((day) => ({ day, count: dailyMap[day] || 0 })),
    monthlyLast12: monthKeys.map((month) => ({ month, count: monthlyMap[month] || 0 })),
    recent,
    timeZone: OWNER_TIME_ZONE,
    capped: users.length >= AUTH_USERS_PER_PAGE * AUTH_USERS_MAX_PAGES,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido' });
  const user = await requireUser(req, res);
  if (!user) return;
  if (!isOwnerEmail(user.email)) return res.status(403).json({ error: 'Solo el dueno puede ver estas metricas' });

  try {
    const supabase = getSupabaseServer();
    const now = new Date();
    const onlineFrom = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 6 * MS_PER_DAY).toISOString();
    const monthStart = new Date(now.getTime() - 29 * MS_PER_DAY).toISOString();
    const yearStart = new Date(now.getTime() - 364 * MS_PER_DAY).toISOString();

    const [onlineRes, dailyRes, weeklyRes, monthlyRes, yearlyRes, searchEventsRes, registrationStats] = await Promise.all([
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', onlineFrom),
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', dayStart.toISOString()),
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', weekStart),
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', monthStart),
      supabase.from('presence_heartbeats').select('session_key,user_id,is_authenticated,last_seen_at').gte('last_seen_at', yearStart),
      supabase.from('analytics_events').select('event_name,created_at').in('event_name', ['search_registration_gate', 'search_completed']).gte('created_at', yearStart),
      getRegistrationStats(supabase, now),
    ]);

    const onlineRows = onlineRes.data || [];
    const dailyRows = dailyRes.data || [];
    const weeklyRows = weeklyRes.data || [];
    const monthlyRows = monthlyRes.data || [];
    const yearlyRows = yearlyRes.data || [];
    const unique = (rows, mapper) => Array.from(new Set(rows.map(mapper).filter(Boolean)));
    const visits = buildPresenceSeries(yearlyRows, now);
    const searches = buildSearchStats(searchEventsRes.data || [], now);

    const stats = {
      online_now: unique(onlineRows, (row) => row.user_id || row.session_key).length,
      authenticated_online_now: unique(onlineRows.filter((row) => row.is_authenticated), (row) => row.user_id || row.session_key).length,
      unique_visitors_today: unique(dailyRows, (row) => row.session_key).length,
      unique_users_today: unique(dailyRows.filter((row) => row.user_id), (row) => row.user_id).length,
      unique_visitors_last7_days: unique(weeklyRows, (row) => row.session_key).length,
      unique_visitors_last30_days: unique(monthlyRows, (row) => row.session_key).length,
      unique_users_last7_days: unique(weeklyRows.filter((row) => row.user_id), (row) => row.user_id).length,
      unique_users_last30_days: unique(monthlyRows.filter((row) => row.user_id), (row) => row.user_id).length,
      heartbeat_window_minutes: 5,
    };

    return res.status(200).json({
      ok: true,
      checkedAt: now.toISOString(),
      stats,
      onlineNow: stats.online_now,
      onlineAuthenticatedNow: stats.authenticated_online_now,
      dailyUniqueVisitors: stats.unique_visitors_today,
      dailyUniqueUsers: stats.unique_users_today,
      weeklyUniqueVisitors: stats.unique_visitors_last7_days,
      monthlyUniqueVisitors: stats.unique_visitors_last30_days,
      weeklyUniqueUsers: stats.unique_users_last7_days,
      monthlyUniqueUsers: stats.unique_users_last30_days,
      customerLogins: registrationStats.logins,
      registrations: registrationStats,
      visits,
      searches,
      newUsersToday: registrationStats.today,
      newUsersLast7Days: registrationStats.last7Days,
      newUsersThisMonth: registrationStats.thisMonth,
      totalRegisteredUsers: registrationStats.total,
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron cargar metricas en vivo' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
