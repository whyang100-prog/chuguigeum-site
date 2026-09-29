import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createClient} from '@libsql/client';import {migrate} from './schema.mjs';import {featureRoutes} from './features.mjs';
test('회원·개인 기록·사례 승인·통계·관리자 권한·세션 폐기 통합',async()=>{
const dir=await mkdtemp(join(tmpdir(),'gift-test-'));const db=createClient({url:'file:'+join(dir,'test.db')});await migrate(db);await migrate(db);const routes=featureRoutes(db);const server=http.createServer(async(req,res)=>{const json=(s,b)=>{res.writeHead(s,{'Content-Type':'application/json'});res.end(JSON.stringify(b));};try{if(!await routes(req,res,new URL(req.url,'http://localhost'),json))json(404,{});}catch(e){json(e.status||500,{error:e.message});}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;process.env.APP_ORIGIN=base;
async function call(path,method='GET',body,cookie='',origin=base){const r=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'chuguigeum',Origin:origin,Cookie:cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
try{
assert.equal((await call('records')).status,401);
const a=await call('auth/register','POST',{username:'alice',password:'test-password-123',consent:true,role:'admin'});assert.equal(a.status,200);assert.equal(a.body.user.role,'member');
const b=await call('auth/register','POST',{username:'bobby',password:'test-password-456',consent:true});assert.equal(b.status,200);
assert.equal((await call('auth/login','POST',{username:'alice',password:'wrong-password'})).status,401);
assert.equal((await call('admin/users','GET',null,a.cookie)).status,403);
const record={kind:'wedding',direction:'paid',person:'PRIVATE NAME',relation:'close',amount:150000,event_date:'2026-09-23',memo:'PRIVATE MEMO'};
assert.equal((await call('records','POST',record,a.cookie,'https://evil.example')).status,403);
assert.equal((await call('records','POST',record,a.cookie)).status,200);
let own=(await call('records','GET',null,a.cookie)).body.records;assert.equal(own.length,1);const id=own[0].id;
assert.equal((await call('records','GET',null,b.cookie)).body.records.length,0);
assert.equal((await call('records/'+id,'PUT',record,b.cookie)).status,404);assert.equal((await call('records/'+id,'DELETE',{},b.cookie)).status,404);
assert.equal((await call('records/'+id,'PUT',{...record,kind:'funeral',amount:50000},a.cookie)).status,200);
assert.equal((await call('records/'+id,'PUT',{...record,event_date:'2026-02-30'},a.cookie)).status,400);
const sample={kind:'wedding',relation:'colleague',amount:100000,attendance:'meal',people:1,event_month:new Date().toISOString().slice(0,7),story:'함께 일하는 동료라서 이 금액을 냈습니다.',consent:true};
assert.equal((await call('cases','POST',sample,a.cookie)).status,201);
assert.equal((await call('community')).body.count,0);const caseId=(await call('cases','GET',null,a.cookie)).body.cases[0].id;
await db.execute({sql:"UPDATE users SET role='admin' WHERE id=?",args:[b.body.user.id]});
assert.equal((await call('admin/cases/'+caseId,'PATCH',{status:'approved'},b.cookie)).status,200);
let stats=(await call('community')).body;assert.equal(stats.count,1);assert.equal(stats.median,null);assert.ok(!JSON.stringify(stats).includes('PRIVATE'));assert.ok(!JSON.stringify(stats).includes(a.body.user.id));
// Four additional independent participants, only inside this temporary test DB.
for(let i=0;i<4;i++){await db.execute({sql:"INSERT INTO users(id,username,password_hash,created_at) VALUES (?,?,?,?)",args:['fixture'+i,'fixture'+i,'unused',new Date().toISOString()]});await db.execute({sql:"INSERT INTO cases(id,user_id,kind,relation,amount,attendance,people,event_month,story,status,created_at) VALUES (?,?,'wedding','colleague',?,'meal',1,?,?,'approved',?)",args:['sample'+i,'fixture'+i,[50000,150000,200000,300000][i],sample.event_month,'Test-only story',new Date().toISOString()]});}
stats=(await call('community')).body;assert.equal(stats.count,5);assert.equal(stats.median,150000);
assert.equal((await call('community?people=2')).body.count,0);
const members=(await call('admin/users','GET',null,b.cookie)).body;assert.ok(!JSON.stringify(members).includes('password_hash'));
assert.equal((await call('admin/users/'+a.body.user.id,'PATCH',{status:'suspended'},b.cookie)).status,200);assert.equal((await call('records','GET',null,a.cookie)).status,401);assert.equal((await call('community')).body.count,4);
await call('admin/users/'+a.body.user.id,'PATCH',{status:'active'},b.cookie);assert.equal((await call('records','GET',null,a.cookie)).status,401);
const login=await call('auth/login','POST',{username:'alice',password:'test-password-123'});assert.equal(login.status,200);
await call('cases/'+caseId,'DELETE',{},login.cookie);assert.equal((await call('community')).body.count,4);
assert.equal((await call('auth/password','POST',{current:'test-password-123',password:'replacement-password'},login.cookie)).status,200);assert.equal((await call('records','GET',null,login.cookie)).status,401);
const again=await call('auth/login','POST',{username:'alice',password:'replacement-password'});await call('auth/account','DELETE',{password:'replacement-password'},again.cookie);assert.equal((await db.execute({sql:'SELECT * FROM records WHERE user_id=?',args:[a.body.user.id]})).rows.length,0);assert.equal((await call('auth/me','GET',null,again.cookie)).body.user,null);
await call('auth/logout','POST',{},b.cookie);assert.equal((await call('admin/users','GET',null,b.cookie)).status,401);
}finally{delete process.env.APP_ORIGIN;await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
