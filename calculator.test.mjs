import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from './public/calculator.js';
import {server} from './server.mjs';
import {readFile} from 'node:fs/promises';
test('식대와 동반 인원 반영, 식사하지 않을 때 제외',()=>{
 assert.equal(calculate({relation:'acquaintance',meal:80000,people:2}).amount,200000);
 assert.equal(calculate({relation:'close',attendance:'absent',meal:100000,people:5}).amount,150000);
 assert.equal(calculate({relation:'colleague',meal:null}).amount,100000);
 assert.equal(calculate({relation:'colleague',meal:100000}).amount,100000);
 assert.equal(calculate({relation:'colleague',meal:100001}).amount,150000);
 assert.throws(()=>calculate({meal:-1}));assert.throws(()=>calculate({people:1.5}));assert.throws(()=>calculate({relation:'__proto__'}));
});
test('전국 필터 데이터와 출처 무결성',async()=>{
 const data=JSON.parse(await readFile(new URL('./data/venues.json',import.meta.url),'utf8'));
 assert.equal(new Set(data.map(x=>x.region)).size,17);assert.equal(new Set(data.map(x=>x.id)).size,data.length);
 for(const v of data){assert.ok(new URL(v.source).protocol==='https:');assert.ok(v.meal===null||Number.isInteger(v.meal));assert.ok(v.checkedAt);}
});
test('서버 검색, 정적 화면, 비밀 파일 차단',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {const base=`http://127.0.0.1:${server.address().port}`;
 const response=await fetch(base+'/');assert.equal(response.status,200);assert.match(await response.text(),/축의금 얼마하지/);
 const r=await fetch(base+'/api/venues?region='+encodeURIComponent('전북'));assert.equal(r.status,200);const body=await r.json();assert.ok(body.venues.length);assert.ok(body.venues.every(v=>v.region==='전북'));
 assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/api/venues',{method:'POST'})).status,405);
 assert.equal((await fetch(base+'/healthz')).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
