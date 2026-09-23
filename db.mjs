import {createClient} from '@libsql/client';
export function database(){
 const url=process.env.TURSO_DATABASE_URL;
 if(!url)throw new Error('TURSO_DATABASE_URL is required');
 if(process.env.NODE_ENV==='production'&&!url.startsWith('libsql://')&&!url.startsWith('https://'))throw new Error('Production requires a remote Turso libSQL URL');
 if(process.env.NODE_ENV==='production'&&!process.env.TURSO_AUTH_TOKEN)throw new Error('TURSO_AUTH_TOKEN is required');
 return createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
}
