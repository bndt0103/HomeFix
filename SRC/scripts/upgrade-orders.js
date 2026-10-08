import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((rows, value, i, all) => value.startsWith('--') ? [...rows, [value.slice(2), all[i + 1]]] : rows, []));
const sourceName = args.source, targetName = args.target;
if (![sourceName, targetName].every(name => /^HomeFix_[A-Za-z0-9_]{1,60}$/.test(name || '')) || sourceName === targetName) throw new Error('Use different HomeFix_ source and NEW target database names.');
process.env.DB_NAME = targetName;
const { dbConfig } = await import('../backend/src/config.js');
const { sql, q, one, close } = await import('../backend/src/db.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = await new sql.ConnectionPool(dbConfig('master')).connect();
let sourceTransaction;
const bracket = name => '[' + name.replaceAll(']', ']]') + ']';
try {
    if (!(await master.request().input('name', sql.NVarChar, sourceName).query('Select database_id From sys.databases Where name=@name')).recordset.length) throw new Error('Source database missing.');
    if ((await master.request().input('name', sql.NVarChar, targetName).query('Select database_id From sys.databases Where name=@name')).recordset.length) throw new Error('Target already exists; refusing to overwrite.');
    const tables = (await master.request().query(`Select t.name From ${bracket(sourceName)}.sys.tables t Join ${bracket(sourceName)}.sys.schemas s On s.schema_id=t.schema_id Where s.name='dbo' Order By t.name`)).recordset;
    if (!tables.some(table => table.name === 'DonHang') || tables.some(table => table.name === 'ChiTietDonHang')) throw new Error('Source must be the existing single-service HomeFix schema.');
    await master.request().query(`Create Database ${bracket(targetName)}`);
    const files = ['001_schema.sql','002_procedures_triggers.sql','003_cancellation_snapshot.sql','004_auth_otp.sql','005_bank_payments.sql','007_user_avatar.sql','007_temporary_account_locks.sql','008_policy_proposals.sql','008_technician_application.sql','009_customer_location.sql','010_dispatch_communication.sql','011_material_onsite_consent.sql','012_order_item_integrity.sql', '013_vietnamese_dictionary.sql','014_support_chat.sql'];
    for (const file of files) {
        const text = await fs.readFile(path.join(root, 'database', file), 'utf8');
        for (const batch of text.split(/^GO\s*$/mi).filter(text => text.trim())) await q(batch);
    }
    const targets = await q("Select name From sys.tables Where schema_id=Schema_Id('dbo')");
    sourceTransaction = new sql.Transaction(master);
    await sourceTransaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const run = text => new sql.Request(sourceTransaction).query(text);
    // Lock the old command stream and source rows while taking this verified copy.
    await run(`Use ${bracket(sourceName)}; Declare @result Int; Exec @result=sp_getapplock @Resource='HomeFixCommands',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=15000; If @result<0 Throw 51009,'SOURCE_BUSY',1;`);
    for (const table of tables) await run(`Select Count(*) n From ${bracket(sourceName)}.dbo.${bracket(table.name)} With(TabLockX,HoldLock)`);
    await run(`Use ${bracket(targetName)}`);
    for (const table of targets) await run(`Alter Table ${bracket(targetName)}.dbo.${bracket(table.name)} NoCheck Constraint All; Disable Trigger All On ${bracket(targetName)}.dbo.${bracket(table.name)}`);
    // A brand-new target can contain migration reference rows; replace them with the source snapshot.
    for (const table of targets) if (table.name !== 'SchemaVersion') await run(`Delete From ${bracket(targetName)}.dbo.${bracket(table.name)}`);
    await run(`Set Identity_Insert ${bracket(targetName)}.dbo.DonHang On;
        Insert Into ${bracket(targetName)}.dbo.DonHang(MaDonHang,MaKhachHang,DiaChi,MoTa,NgayHen,NgayTao)
        Select id,customerId,address,description,scheduledAt,createdAt From ${bracket(sourceName)}.dbo.DonHang;
        Set Identity_Insert ${bracket(targetName)}.dbo.DonHang Off;`);
    const checks = [];
    for (const table of tables) {
        if (table.name === 'SchemaVersion') continue;
        const targetTable = table.name === 'DonHang' ? 'ChiTietDonHang' : table.name;
        const sourceTablePath = `${bracket(sourceName)}.dbo.${bracket(table.name)}`, targetTablePath = `${bracket(targetName)}.dbo.${bracket(targetTable)}`;
        const columns = (await run(`Select c.name,c.is_identity From ${bracket(sourceName)}.sys.columns c Join ${bracket(sourceName)}.sys.tables t On t.object_id=c.object_id Where t.name=N'${table.name.replaceAll("'", "''")}' And c.is_computed=0 And c.system_type_id<>189 Order By c.column_id`)).recordset;
        const names = columns.map(column => bracket(column.name)).join(',');
        const identity = columns.some(column => column.is_identity);
        const destinationColumns = table.name === 'DonHang' ? names + ',MaDonHang' : names;
        const sourceColumns = table.name === 'DonHang' ? names + ',id' : names;
        if (identity) await run(`Set Identity_Insert ${targetTablePath} On`);
        await run(`Insert Into ${targetTablePath}(${destinationColumns}) Select ${sourceColumns} From ${sourceTablePath}`);
        if (identity) {
            await run(`Set Identity_Insert ${targetTablePath} Off`);
            const value = (await run(`Select Ident_Current('${sourceName}.dbo.${table.name}') currentIdentity`)).recordset[0].currentIdentity;
            if (/^\d+$/.test(String(value))) await run(`DBCC CheckIdent('${targetName}.dbo.${targetTable}',Reseed,${value}) With No_InfoMsgs`);
        }
        const count = (await run(`Select (Select Count(*) From ${sourceTablePath}) sourceCount,(Select Count(*) From ${targetTablePath}) targetCount`)).recordset[0];
        const differences = (await run(`Select Count(*) n From (Select ${names} From ${sourceTablePath} Except Select ${names} From ${targetTablePath}) changes`)).recordset[0].n;
        if (Number(count.sourceCount) !== Number(count.targetCount) || Number(differences) !== 0) throw new Error('Data comparison failed: ' + table.name);
        checks.push({ table: table.name, targetTable, sourceCount: Number(count.sourceCount), targetCount: Number(count.targetCount), differences: Number(differences) });
    }
    for (const table of targets) await run(`Alter Table ${bracket(targetName)}.dbo.${bracket(table.name)} With Check Check Constraint All; Enable Trigger All On ${bracket(targetName)}.dbo.${bracket(table.name)}`);
    await sourceTransaction.commit(); sourceTransaction = null;
    const parentCount = await one('Select Count(*) n From dbo.DonHang');
    const details = await one('Select Count(*) n From dbo.ChiTietDonHang');
    if (Number(parentCount.n) !== Number(details.n)) throw new Error('Parent count mismatch.');
    const output = args.report || path.join(root, 'reports', 'order-upgrade.json');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify({ status: 'PASS', source: sourceName, target: targetName, originalDatabaseUnchanged: true, parentCount: Number(parentCount.n), checks, rowversionRegenerated: true }, null, 2));
    console.log(`PASS: copied and compared ${checks.length} tables into ${targetName}; original ${sourceName} preserved. Report: ${output}`);
} catch (error) {
    if (sourceTransaction) try { await sourceTransaction.rollback(); } catch {}
    throw error;
} finally { await close(); await master.close(); }
