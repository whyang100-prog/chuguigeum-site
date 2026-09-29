import {randomUUID} from 'node:crypto';
import {hashPassword,verifyPassword,digest,newToken} from './auth.mjs';
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const text=(v,min,max,label)=>{if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)fail(400,`${label}: ${min}~${max}자로 입력해 주세요.`);return v.trim();};
const choice=(v,values)=>{if(!values.includes(v))fail(400,'선택한 값이 올바르지 않습니다.');return v;};
const integer=(v,min,max)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail(400,`금액/인원은 ${min}~${max} 범위의 정수여야 합니다.`);return v;};
const relations=['acquaintance','colleague','close','best'];
const now=()=>new Date().toISOString();
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON 형식이 필요합니다.');let input='',size=0;for await(const chunk of req){size+=chunk.length;if(size>16000)fail(413,'입력 내용이 너무 깁니다.');input+=chunk;}try{const value=JSON.parse(input);if(!value||Array.isArray(value)||typeof value!=='object')throw 0;return value;}catch{fail(400,'입력 형식을 확인해 주세요.');}}
export function featureRoutes(db){
 let hashing=0;
 const expensive=async fn=>{if(hashing>=2)fail(429,'로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.');hashing++;try{return await fn();}finally{hashing--;}};
 const query=(sql,args=[])=>db.execute({sql,args});
 async function limit(key,max=12){const expiry=Date.now()+15*60*1000;await query('DELETE FROM auth_limits WHERE expires_at < ?',[Date.now()]);const r=await query('INSERT INTO auth_limits(key,hits,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits',[digest(key),expiry]);if(Number(r.rows[0].hits)>max)fail(429,'요청이 많습니다. 15분 후 다시 시도해 주세요.');}
 async function user(req){const token=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const r=await query("SELECT u.id,u.username,u.role FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'",[digest(token),Date.now()]);return r.rows[0]??null;}
 const cookie=(res,value,age)=>res.setHeader('Set-Cookie',`sid=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`);
 return async(req,res,url,json)=>{
 const path=url.pathname;if(!/^\/api\/(auth|records|cases|community|admin)(\/|$)/.test(path))return false;
 if(!db)fail(503,'계정 기능을 사용하려면 데이터베이스를 연결해 주세요.');
 const mutation=!['GET','HEAD'].includes(req.method);
 if(mutation){const expected=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||'http://localhost:3000';if(req.headers.origin!==new URL(expected).origin||req.headers['x-requested-with']!=='chuguigeum')fail(403,'요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.');}
 if(path==='/api/auth/me'&&req.method==='GET'){json(200,{user:await user(req)});return true;}
 if(['/api/auth/register','/api/auth/login'].includes(path)&&req.method==='POST'){
 const b=await body(req);const username=text(b.username,4,24,'아이디').toLowerCase();if(!/^[a-z0-9_]+$/.test(username))fail(400,'아이디는 영문 소문자, 숫자, 밑줄만 사용할 수 있어요.');
 const password=b.password;if(typeof password!=='string'||password.length<10||password.length>128)fail(400,'비밀번호는 10~128자로 입력해 주세요.');
 await limit('auth-global',200);await limit('auth-user:'+username);
 let u=(await query('SELECT * FROM users WHERE username=?',[username])).rows[0];
 if(path.endsWith('register')){if(u)fail(409,'사용할 수 없는 아이디입니다.');if(b.consent!==true)fail(400,'계정 정보 저장 안내에 동의해 주세요.');const hash=await expensive(()=>hashPassword(password));const id=randomUUID();try{await query("INSERT INTO users(id,username,password_hash,created_at) VALUES (?,?,?,?)",[id,username,hash,now()]);}catch(e){if(e.code?.includes('CONSTRAINT'))fail(409,'사용할 수 없는 아이디입니다.');throw e;}u={id,username,role:'member',status:'active'};}
 else {const stored=u?.password_hash??'00000000000000000000000000000000:'+ '00'.repeat(64);const valid=await expensive(()=>verifyPassword(password,stored));if(!valid||u?.status!=='active')fail(401,'아이디 또는 비밀번호를 확인해 주세요. 정지된 계정은 로그인할 수 없습니다.');}
 const token=newToken();await query('DELETE FROM sessions WHERE expires_at < ?',[Date.now()]);await query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)',[digest(token),u.id,Date.now()+7*86400000]);cookie(res,token,7*86400);json(200,{user:{id:u.id,username:u.username,role:u.role}});return true;
 }
 const u=await user(req);
 if(path==='/api/community'&&req.method==='GET'){
 const kind=choice(url.searchParams.get('kind')||'wedding',['wedding','funeral']);const relation=choice(url.searchParams.get('relation')||'colleague',relations);const attendance=choice(url.searchParams.get('attendance')||'meal',['meal','no-meal','absent']);const people=integer(Number(url.searchParams.get('people')||1),1,10);
 const since=new Date();since.setFullYear(since.getFullYear()-2);const sinceMonth=since.toISOString().slice(0,7);
 const rows=(await query(`SELECT c.id,c.amount,c.story,c.event_month,c.created_at FROM cases c JOIN users u ON u.id=c.user_id WHERE c.status='approved' AND u.status='active' AND c.kind=? AND c.relation=? AND c.attendance=? AND c.people=? AND c.event_month>=? AND NOT EXISTS (SELECT 1 FROM cases newer WHERE newer.user_id=c.user_id AND newer.status='approved' AND newer.kind=c.kind AND newer.relation=c.relation AND newer.attendance=c.attendance AND newer.people=c.people AND (newer.created_at>c.created_at OR (newer.created_at=c.created_at AND newer.id>c.id))) ORDER BY c.amount`,[kind,relation,attendance,people,sinceMonth])).rows;
 const amounts=rows.map(r=>Number(r.amount));const n=amounts.length;const median=n>=5?(n%2?amounts[(n-1)/2]:(amounts[n/2-1]+amounts[n/2])/2):null;
 json(200,{count:n,median,minimum:5,period:'최근 24개월 행사',cases:[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,50)});return true;
 }
 if(!u)fail(401,'로그인이 필요합니다.');
 if(path==='/api/auth/logout'&&req.method==='POST'){const token=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);if(token)await query('DELETE FROM sessions WHERE token_hash=?',[digest(token)]);cookie(res,'',0);json(200,{ok:true});return true;}
 if(path==='/api/auth/password'&&req.method==='POST'){await limit('password:'+u.id);const b=await body(req);const password=b.password;if(typeof password!=='string'||password.length<10||password.length>128)fail(400,'새 비밀번호는 10~128자로 입력해 주세요.');const stored=(await query('SELECT password_hash FROM users WHERE id=?',[u.id])).rows[0];if(typeof b.current!=='string'||b.current.length>128||!await expensive(()=>verifyPassword(b.current,stored.password_hash)))fail(400,'현재 비밀번호가 다릅니다.');const hashed=await expensive(()=>hashPassword(password));await db.batch([{sql:'UPDATE users SET password_hash=? WHERE id=?',args:[hashed,u.id]},{sql:'DELETE FROM sessions WHERE user_id=?',args:[u.id]}],'write');cookie(res,'',0);json(200,{ok:true});return true;}
 if(path==='/api/auth/account'&&req.method==='DELETE'){if(u.role==='admin')fail(400,'관리자 계정은 이 화면에서 탈퇴할 수 없습니다.');const b=await body(req);await limit('delete:'+u.id);const stored=(await query('SELECT password_hash FROM users WHERE id=?',[u.id])).rows[0];if(typeof b.password!=='string'||b.password.length>128||!await expensive(()=>verifyPassword(b.password,stored.password_hash)))fail(400,'비밀번호를 확인해 주세요.');await db.batch(['records','cases','sessions'].map(t=>({sql:`DELETE FROM ${t} WHERE user_id=?`,args:[u.id]})).concat({sql:'DELETE FROM users WHERE id=?',args:[u.id]}),'write');cookie(res,'',0);json(200,{ok:true});return true;}
 if(path==='/api/records'&&req.method==='GET'){const records=(await query('SELECT * FROM records WHERE user_id=? ORDER BY event_date DESC,created_at DESC',[u.id])).rows;json(200,{records});return true;}
 const recordMatch=path.match(/^\/api\/records\/([a-f0-9-]{36})$/);
 if((path==='/api/records'&&req.method==='POST')||(recordMatch&&req.method==='PUT')){
 const b=await body(req);const date=text(b.event_date,10,10,'날짜');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail(400,'유효한 날짜를 입력해 주세요.');
 const values=[choice(b.kind,['wedding','funeral']),choice(b.direction,['paid','received']),text(b.person,1,50,'이름'),choice(b.relation,relations),integer(b.amount,0,100000000),date,text(b.memo??'',0,500,'메모')];
 if(recordMatch){const r=await query('UPDATE records SET kind=?,direction=?,person=?,relation=?,amount=?,event_date=?,memo=? WHERE id=? AND user_id=?',[...values,recordMatch[1],u.id]);if(!r.rowsAffected)fail(404,'기록을 찾을 수 없습니다.');}
 else {await limit('record:'+u.id,100);await query('INSERT INTO records(id,user_id,kind,direction,person,relation,amount,event_date,memo,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',[randomUUID(),u.id,...values,now()]);}
 json(200,{ok:true});return true;
 }
 if(recordMatch&&req.method==='DELETE'){const r=await query('DELETE FROM records WHERE id=? AND user_id=?',[recordMatch[1],u.id]);if(!r.rowsAffected)fail(404,'기록을 찾을 수 없습니다.');json(200,{ok:true});return true;}
 if(path==='/api/cases'&&req.method==='GET'){json(200,{cases:(await query('SELECT * FROM cases WHERE user_id=? ORDER BY created_at DESC',[u.id])).rows});return true;}
 if(path==='/api/cases'&&req.method==='POST'){const b=await body(req);if(b.consent!==true)fail(400,'익명 공개와 통계 활용에 동의해 주세요.');await limit('case:'+u.id,10);const month=text(b.event_month,7,7,'행사 월');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<'2000-01'||month>today().slice(0,7))fail(400,'행사 월은 2000년부터 현재까지 입력해 주세요.');await query('INSERT INTO cases(id,user_id,kind,relation,amount,attendance,people,event_month,story,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',[randomUUID(),u.id,choice(b.kind,['wedding','funeral']),choice(b.relation,relations),integer(b.amount,10000,10000000),choice(b.attendance,['meal','no-meal','absent']),integer(b.people,1,10),month,text(b.story,10,500,'사례 설명'),now()]);json(201,{ok:true});return true;}
 const caseMatch=path.match(/^\/api\/cases\/([a-f0-9-]{36})$/);
 if(caseMatch&&req.method==='DELETE'){const r=await query('DELETE FROM cases WHERE id=? AND user_id=?',[caseMatch[1],u.id]);if(!r.rowsAffected)fail(404,'사례를 찾을 수 없습니다.');json(200,{ok:true});return true;}
 if(path.startsWith('/api/admin/')){
 if(u.role!=='admin')fail(403,'관리자만 접근할 수 있습니다.');
 if(path==='/api/admin/users'&&req.method==='GET'){json(200,{users:(await query('SELECT id,username,role,status,created_at FROM users ORDER BY created_at DESC')).rows});return true;}
 if(path==='/api/admin/cases'&&req.method==='GET'){json(200,{cases:(await query('SELECT c.*,u.username FROM cases c JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC')).rows});return true;}
 const member=path.match(/^\/api\/admin\/users\/([a-f0-9-]{36})$/);const item=path.match(/^\/api\/admin\/cases\/([a-f0-9-]{36})$/);
 if(req.method==='PATCH'&&(member||item)){const b=await body(req);const id=(member||item)[1];const status=choice(b.status,member?['active','suspended']:['approved','rejected','pending']);const target=(await query(member?'SELECT role FROM users WHERE id=?':'SELECT id FROM cases WHERE id=?',[id])).rows[0];if(!target)fail(404,'대상을 찾을 수 없습니다.');if(member&&target.role==='admin')fail(400,'관리자 계정은 정지할 수 없습니다.');const statements=[{sql:member?'UPDATE users SET status=? WHERE id=?':'UPDATE cases SET status=? WHERE id=?',args:[status,id]}];if(member)statements.push({sql:'DELETE FROM sessions WHERE user_id=?',args:[id]});statements.push({sql:'INSERT INTO admin_audit(id,admin_id,action,target_id,created_at) VALUES (?,?,?,?,?)',args:[randomUUID(),u.id,`${member?'member':'case'}:${status}`,id,now()]});await db.batch(statements,'write');json(200,{ok:true});return true;}
 }
 fail(405,'지원하지 않는 요청입니다.');
 };
}
