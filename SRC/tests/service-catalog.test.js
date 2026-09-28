import test from 'node:test';
import assert from 'node:assert/strict';
import {q,transaction,close} from '../backend/src/db.js';
import {applyServiceCatalog} from '../scripts/service-catalog.js';
import {serviceCatalog} from '../database/service-catalog.js';
test('catalog migration preserves custom services, prices, IDs and repeats without writes',{skip:!/^HomeFix_.*Test/.test(process.env.DB_NAME||'')},async()=>{
 try{await transaction(null,async t=>{
  await q('DELETE FROM dbo.SchemaVersion WHERE version=6',{},t);
  const columns='id,name,groupCode,description,inspectionFee,laborFee,commissionRatePercent,isActive,isPopular';
  const before=await q('SELECT '+columns+' FROM dbo.DichVu ORDER BY id',{},t);
  await applyServiceCatalog(t);
  const after=await q('SELECT '+columns+' FROM dbo.DichVu ORDER BY id',{},t);
  for(const old of before)assert.deepEqual(after.find(row=>row.id===old.id),old);
  for(const [name] of serviceCatalog)assert.ok(after.some(row=>row.name===name),name);
  const unchanged=await q('SELECT * FROM dbo.DichVu ORDER BY id',{},t);
  assert.equal((await applyServiceCatalog(t)).alreadyApplied,true);
  assert.deepEqual(await q('SELECT * FROM dbo.DichVu ORDER BY id',{},t),unchanged);
 });}finally{await close();}
});
