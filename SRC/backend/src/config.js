import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const backendDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(backendDir,'.env'),quiet:true});
export const config={port:Number(process.env.PORT||3000),server:process.env.DB_SERVER||'localhost',database:process.env.DB_NAME||'HomeFix_Final',windows:process.env.DB_AUTH!=='sql',secret:process.env.JWT_SECRET,uploads:path.join(backendDir,'uploads'),origins:[...new Set((process.env.CLIENT_ORIGINS||'http://localhost:5173,http://localhost:3000,https://localhost,http://localhost').split(',').map(s=>s.trim()).filter(Boolean))]};
export function dbConfig(database=config.database){
 // Native ODBC reads use libuv workers. Reserve a worker for commit/rollback so
 // blocked readers cannot occupy every worker while a transaction holds locks.
 const workers=Number(process.env.UV_THREADPOOL_SIZE)||4;
 const max=config.windows?Math.max(1,Math.min(8,workers-1)):8;
 const shared={server:config.server,database,requestTimeout:20000,connectionTimeout:10000,pool:{min:0,max,idleTimeoutMillis:30000},options:{encrypt:process.env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true,abortTransactionOnError:true}};
 if(config.windows){const escaped=s=>'{'+s.replaceAll('}','}}')+'}';return {...shared,connectionString:`Driver=${escaped(process.env.DB_ODBC_DRIVER||'ODBC Driver 17 for SQL Server')};Server=${escaped(config.server)};Database=${escaped(database)};Trusted_Connection=Yes;Encrypt=${process.env.DB_ENCRYPT==='true'?'Yes':'No'};TrustServerCertificate=Yes;`,options:{...shared.options,trustedConnection:true}};}
 return {...shared,user:process.env.DB_USER,password:process.env.DB_PASSWORD};
}
