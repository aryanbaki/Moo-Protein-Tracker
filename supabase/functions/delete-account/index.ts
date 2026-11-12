// Supabase Edge Function: delete-account
//
// Deletes the calling user's rows and then the auth user itself. The app calls
// this from Settings > Delete account (App Store guideline 5.1.1(v)).
//
// Auth: the caller's JWT (Authorization: Bearer <access token>) is verified
// here; the user id is taken from the verified token, never from the body, so
// nobody can delete someone else's account.
//
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided to every edge function by Supabase. Nothing extra to set.
// eslint-disable-next-line import/no-unresolved -- Deno specifier, resolved by the Supabase runtime
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json(500, { error: 'server_not_configured' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'missing_token' });

  // Verify the JWT with the auth server (also rejects expired / revoked sessions).
  const asUser = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await asUser.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: 'invalid_token' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // The foreign keys cascade from auth.users, but delete explicitly first so a
  // failure is reported before the login is removed and the user can retry.
  for (const [table, column] of [
    ['food_entries', 'user_id'],
    ['creatine_logs', 'user_id'],
    ['weight_logs', 'user_id'],
    ['profiles', 'id'],
  ] as const) {
    const { error } = await admin.from(table).delete().eq(column, user.id);
    if (error) {
      console.error(`delete-account: ${table} failed`, error.message);
      return json(500, { error: 'delete_failed', step: table });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('delete-account: auth user failed', deleteError.message);
    return json(500, { error: 'delete_failed', step: 'auth_user' });
  }

  return json(200, { ok: true });
});
