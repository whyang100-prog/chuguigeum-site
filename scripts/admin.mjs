import {database} from '../db.mjs';
import {migrate} from '../schema.mjs';
import {hashPassword} from '../auth.mjs';
import {randomUUID} from 'node:crypto';
const name=process.env.ADMIN_USERNAME?.toLowerCase();const password=process.env.ADMIN_PASSWORD;
if(!name||!/^[a-z0-9_]{4,24}$/.test(name)||!password||password.length<14||password.length>128)throw new Error('Set ADMIN_USERNAME (4-24 lowercase letters/numbers/_) and ADMIN_PASSWORD (14-128 characters) in server environment.');
const db=database();try{await migrate(db);const old=(await db.execute({sql:'SELECT id,role FROM users WHERE username=?',args:[name]})).rows[0];if(old?.role==='member')throw new Error('This username belongs to a member. Choose a different administrator username.');if(old){console.log('Administrator already exists; no changes made.');}else{await db.execute({sql:"INSERT INTO users(id,username,password_hash,role,created_at) VALUES (?,?,?,'admin',?)",args:[randomUUID(),name,await hashPassword(password),new Date().toISOString()]});console.log('Administrator created. Remove ADMIN_PASSWORD from environment after setup.');}}finally{db.close();}
