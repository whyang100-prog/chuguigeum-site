import {readFile} from 'node:fs/promises';
import {database} from '../db.mjs';
const db=database();
const records=JSON.parse(await readFile(new URL('../data/venues.json',import.meta.url),'utf8'));
await db.execute(`CREATE TABLE IF NOT EXISTS venues (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, district TEXT NOT NULL,
 meal INTEGER CHECK(meal IS NULL OR (meal >= 0 AND meal <= 1000000)), source TEXT NOT NULL,
 source_name TEXT NOT NULL, checked_at TEXT NOT NULL, price_date TEXT, status TEXT NOT NULL
)`);
await db.execute('CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region)');
await db.batch(records.map(v=>({sql:'INSERT INTO venues (id,name,region,district,meal,source,source_name,checked_at,price_date,status) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',args:[v.id,v.name,v.region,v.district,v.meal,v.source,v.sourceName,v.checkedAt,v.priceDate,v.status]})),'write');
await db.execute('PRAGMA optimize');
console.log(`Seed completed: ${records.length} records considered; existing records preserved.`);db.close();
