export async function migrate(db){
const statements=[
`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL)`,
`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
`CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('wedding','funeral')),direction TEXT NOT NULL CHECK(direction IN ('paid','received')),person TEXT NOT NULL,relation TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount BETWEEN 0 AND 100000000),event_date TEXT NOT NULL,memo TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id,event_date)`,
`CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL,relation TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount BETWEEN 10000 AND 10000000),attendance TEXT NOT NULL,people INTEGER NOT NULL,event_month TEXT NOT NULL,story TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status,kind,relation)`,
`CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL)`,
`CREATE TABLE IF NOT EXISTS admin_audit(id TEXT PRIMARY KEY,admin_id TEXT NOT NULL,action TEXT NOT NULL,target_id TEXT NOT NULL,created_at TEXT NOT NULL)`
];
await db.batch(statements,'write');
}
