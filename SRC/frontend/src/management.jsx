import {MonitoringSettings,ReportOverview,CashflowChart,useReportData} from './report-widgets';
import { AttentionDot } from './attention';
import { ReportWorkspace, csvDownload } from './reports-ui';
import { ApplicationWizard } from './application-wizard';
import { WalletHistory } from './wallet-history';
import { BankAccounts, BankPaymentQueue } from './bank-admin';
import React, { useEffect, useRef, useState } from 'react'; import { Link, useLocation, useParams } from 'react-router-dom'; import { Plus, Pencil, CheckCircle2, Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Download, Star, ShieldCheck, Users, ChartNoAxesCombined, Lock, ChevronRight, Search, UserCircle, AlertTriangle, MessageSquare, ClipboardCheck, ThumbsDown, History } from 'lucide-react';
import { api, upload, uuid } from './api'; import { useApp, useData, useAction, PageHead, Card, Field, ErrorBox, Loading, Empty, Submit, Badge, money, date, code, labels, roleNames, groups, Modal, ProtectedImage } from './shared'; import { Stat } from './pages';
function Table({ headers, rows, render, empty = 'Chưa có dữ liệu' }) { return rows?.length ? <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(render)}</tbody></table></div> : <Empty title={empty} />; }
function AdminOrders() {
  const [filter, setFilter] = useState({ status: '', serviceGroup: '', from: '', to: '', page: 1 });
  const q = new URLSearchParams();
  if (filter.status) q.set('status', filter.status);
  if (filter.serviceGroup) q.set('serviceGroup', filter.serviceGroup);
  if (filter.from) q.set('from', new Date(filter.from + 'T00:00:00+07:00').toISOString());
  if (filter.to) { const t = new Date(filter.to + 'T00:00:00+07:00'); t.setDate(t.getDate() + 1); q.set('to', t.toISOString()); }
  q.set('page', filter.page);
  q.set('pageSize', 15);
  const r = useData('/orders?' + q.toString());
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  const exportCsv = async () => { const blob = await api('/orders.csv?' + q.toString(), { blob: true }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'DanhSachDonHang.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <><PageHead eyebrow="QUẢN TRỊ HOMEFIX" title="Đơn sửa chữa & Bảo trì" text="Quản lý và tra cứu toàn bộ đơn dịch vụ trên hệ thống.">
    <Link className="btn primary" to="/services"><Plus size={17} /> Khởi tạo đơn mới</Link>
    <button className="btn" onClick={exportCsv}><Download size={16} /> Xuất CSV</button>
  </PageHead>
    <div className="filter-bar">
      <Field label="Trạng thái"><select value={filter.status} onChange={e => set('status', e.target.value)}><option value="">Tất cả</option>{Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Nhóm dịch vụ"><select value={filter.serviceGroup} onChange={e => set('serviceGroup', e.target.value)}><option value="">Tất cả</option>{Object.entries(groups).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Từ ngày"><input type="date" value={filter.from} onChange={e => set('from', e.target.value)} /></Field>
      <Field label="Đến ngày"><input type="date" value={filter.to} onChange={e => set('to', e.target.value)} /></Field>
    </div>
    <ErrorBox error={r.error} />
    {r.loading ? <Loading /> : <Card>
      <Table headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Kỹ thuật viên', 'Ngày tạo', 'Trạng thái', 'Thao tác']} rows={r.data} render={o => <tr key={o.id}>
        <td><b>{code(o.id)}</b></td>
        <td>{o.serviceName}<small>{groups[o.serviceGroup]}</small></td>
        <td>{o.contactName}<small>{o.contactPhone}</small></td>
        <td>{o.technicianName || '—'}</td>
        <td>{date(o.createdAt)}</td>
        <td><Badge value={o.status} /></td>
        <td><Link className="btn small" to={'/orders/' + o.id}>Chi tiết</Link></td>
      </tr>} />
    </Card>}
    <div className="pagination"><button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button><span>Trang {filter.page}</span><button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button></div>
  </>;
}
function AdminUsers() {
  const { toast } = useApp();
  const [filter, setFilter] = useState({ search: '', role: '', status: '', page: 1 });
  const [view, setView] = useState({ type: 'list', record: null });
  const q = new URLSearchParams();
  if (filter.search) q.set('search', filter.search);
  if (filter.role) q.set('role', filter.role);
  if (filter.status) q.set('status', filter.status);
  q.set('page', filter.page);
  q.set('pageSize', 15);
  const r = useData('/users?' + q.toString());
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  const refresh = () => { r.reload(); toast('Đã gửi yêu cầu tải lại danh sách tài khoản.'); };

  const getDepartment = (u) => {
    if (u.role === 'KH') return '—';
    if (u.role === 'KTV') return u.skillGroup ? 'Đội kỹ thuật ' + groups[u.skillGroup] : 'Đội kỹ thuật';
    if (u.role === 'DPV') return 'Đội Điều phối';
    if (u.role === 'CSKH') return 'Đội CSKH Online';
    if (u.role === 'KT') return 'Đội Kế toán Tổng hợp';
    if (u.role === 'ADMIN') return 'Đội Vận hành Hệ thống';
    if (u.role === 'GD') return 'Ban Giám đốc Điều hành';
    return '—';
  };

  if (view.type === 'detail') return <UserDetail record={view.record} onBack={() => setView({ type: 'list', record: null })} onSecurity={u => setView({ type: 'security', record: u })} onSaved={user => {setView({type:'detail',record:user});r.reload();}} />;
  if (view.type === 'security') return <UserSecurity record={view.record} onBack={() => setView({ type: 'list', record: null })} onLocked={user => { r.setData(users => users?.map(item => item.id === user.id ? { ...item, ...user } : item)); setView({ type: 'list', record: null }); }} />;

  return <><PageHead eyebrow="QUẢN TRỊ HOMEFIX" title="Danh sách tài khoản hệ thống" text="Tra cứu tài khoản, vai trò và trạng thái hoạt động.">
    <button className="btn" onClick={refresh}><RefreshCw size={16} /> Cập nhật</button>
    <button className="btn primary" onClick={() => setView({ type: 'create', record: {} })}><Plus size={17} /> Thêm tài khoản</button>
  </PageHead>
    <div className="filter-bar">
      <Field label="Tìm kiếm"><input type="search" placeholder="Tìm họ tên, số điện thoại..." value={filter.search} onChange={e => set('search', e.target.value)} /></Field>
      <Field label="Vai trò"><select value={filter.role} onChange={e => set('role', e.target.value)}><option value="">Tất cả</option>{Object.entries(roleNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Trạng thái"><select value={filter.status} onChange={e => set('status', e.target.value)}><option value="">Tất cả</option><option value="active">Hoạt động</option><option value="inactive">Bị khóa / Chờ duyệt</option></select></Field>
    </div>
    <ErrorBox error={r.error} />
    {r.loading ? <Loading /> : <Card>
      <Table headers={['Mã ID', 'Họ và tên', 'Số điện thoại', 'Email', 'Vai trò', 'Bộ phận', 'Trạng thái', 'Thao tác']} rows={r.data} render={u => {
        const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date(); return <tr key={u.id}>
          <td><b style={{ color: '#116a4e' }}>{u.role}-{String(u.id).padStart(4, '0')}</b></td>
          <td><div className="flex-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '24px', borderRadius: '12px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={14} color="#888" /></div> <b>{u.fullName}</b></div></td>
          <td>{u.phone}</td>
          <td>{u.email || '—'}</td>
          <td><b>{roleNames[u.role]}</b></td>
          <td><small>{getDepartment(u)}</small></td>
          <td><span className={'badge ' + (u.isActive && !isLocked ? 'green' : 'red')}>{isLocked ? 'Đang khóa' : u.isActive ? 'Hoạt động' : 'Bị khóa'}</span>{isLocked && <small>{'Đến ' + date(u.lockedUntil)}</small>}</td>
          <td>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn small" onClick={() => setView({ type: 'detail', record: u })} title="Chi tiết tài khoản"><Pencil size={14} /></button>
              <button className="icon-btn small" onClick={() => setView({ type: 'security', record: u })} title="Khóa tài khoản tạm thời" style={{ color: '#d93025' }}><Lock size={14} /></button>
            </div>
          </td>
        </tr>
      }} />
    </Card>}
    <div className="pagination">
      <span style={{ marginRight: 'auto' }}>Hiển thị {(filter.page - 1) * 15 + 1} - {Math.min(filter.page * 15, r.meta?.total || 0)} của {r.meta?.total || 0} tài khoản</span>
      <button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button>
      <span>Trang {filter.page}</span>
      <button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button>
    </div>
    {view.type === 'create' && <Editor section="users" record={view.record} onClose={() => setView({ type: 'list', record: null })} onDone={() => { setView({ type: 'list', record: null }); r.reload(); }} />}
  </>;
}
function UserDetail({ record, onBack, onSecurity, onSaved }) {
  const a = useAction();
  const [form, setForm] = useState({
    fullName: record.fullName || '',
    phone: record.phone || '',
    role: record.role || 'KH',
    skillGroup: record.skillGroup || 'DienLanh',
    isActive: record.isActive ?? true
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const save = () => a.run(async () => {
    const updated=await api('/users/' + record.id, { method: 'PATCH', body: { fullName: form.fullName, role: form.role, skillGroup: form.skillGroup, isActive: form.isActive, expectedVersion: record.version } });
    onSaved(updated.data);
  }, 'Đã cập nhật tài khoản thành công.');

  const logs = useData(record.id ? '/audit-logs' : '');
  const userLogs = (logs.data || []).filter(l => l.actorId === record.id).slice(0, 5);

  return <div className="user-detail-page">
    <div className="breadcrumb" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#5f6368', marginBottom: '24px' }}>
      <span onClick={onBack} style={{ cursor: 'pointer', fontWeight: '500' }}>Quản lý tài khoản</span>
      <ChevronRight size={16} />
      <b style={{ color: '#202124' }}>Chi tiết tài khoản</b>
    </div>

    <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #eee', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} color="#888" /></div>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Hồ sơ TK: {record.fullName} <Badge value={record.isActive ? 'Hoạt động' : 'Bị khóa'} /></h2>
          <small style={{ color: '#5f6368' }}>Mã số tài khoản: {record.role}-{record.id ? String(record.id).padStart(4, '0') : ''} • Email: {record.email || '—'}</small>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn" style={{ color: '#d93025', borderColor: '#fce8e6', background: '#fce8e6' }} onClick={() => onSecurity(record)}>Khóa tài khoản</button>
        <button className="btn primary" style={{ background: '#116a4e' }} disabled={a.busy} onClick={save}>{a.busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </div>
    <ErrorBox error={a.error} />

    <div className="detail-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
      <Card title="Chỉnh sửa thông tin hồ sơ">
        <Field label="Họ và tên"><input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} /></Field>
        <Field label="Số điện thoại"><input type="text" value={form.phone} readOnly style={{ background: '#f1f3f4', cursor: 'not-allowed' }} /></Field>
        <Field label="Nhóm vai trò">
          <select value={form.role} onChange={e => set('role', e.target.value)}>
            {Object.entries(roleNames).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </Field>
        {form.role === 'KTV' && <Field label="Chuyên môn">
          <select value={form.skillGroup} onChange={e => set('skillGroup',e.target.value)}>
            {Object.entries(groups).map(([key,name])=><option key={key} value={key}>{name}</option>)}
          </select>
        </Field>}
        <label className="checkbox" style={{ marginTop: '12px' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Tài khoản hoạt động
        </label>
        <div style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
          <b style={{ display: 'block', marginBottom: '12px' }}>Lịch sử hoạt động gần đây</b>
          {logs.loading ? <small style={{ color: '#aaa' }}>Đang tải…</small> : userLogs.length === 0 ?
            <div style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px 0' }}>Không có lịch sử hoạt động nào.</div> :
            userLogs.map(l => <div key={l.id} style={{ fontSize: '13px', color: '#5f6368', marginBottom: '12px' }}>
              <span style={{ color: '#202124' }}>{l.action} — {l.entity}{l.entityId ? ' #' + l.entityId : ''}{l.detail ? ' (' + l.detail + ')' : ''}</span><br />
              <small style={{ color: '#aaa' }}>{date(l.createdAt)}</small>
            </div>)
          }
        </div>
      </Card>

      <Card title="Quyền theo vai trò">
        <p>Quyền truy cập được áp dụng theo vai trò đã chọn: <b>{roleNames[form.role]}</b>.</p>
        <p>{({
          KH:'Đặt dịch vụ, duyệt báo giá, nghiệm thu, thanh toán và gửi yêu cầu hỗ trợ cho đơn của mình.',
          KTV:'Phản hồi phân công, cập nhật công việc, kê khai vật tư đã thống nhất với khách, lập nghiệm thu, ghi nhận thu tiền mặt và quản lý ví.',
          DPV:'Trao đổi với khách hàng, lập báo giá sơ bộ, phân công kỹ thuật viên và xử lý yêu cầu hủy.',
          CSKH:'Tiếp nhận hỗ trợ, xử lý khiếu nại và bảo hành, theo dõi đánh giá chất lượng dịch vụ.',
          KT:'Xác minh chuyển khoản, đối soát, duyệt yêu cầu ví và xem báo cáo tài chính.',
          GD:'Xem báo cáo vận hành, chất lượng, tài chính và phê duyệt đề xuất chính sách.',
          ADMIN:'Quản lý tài khoản, dịch vụ, cấu hình, tài khoản nhận tiền; duyệt hồ sơ kỹ thuật viên và tra cứu nhật ký.'
        })[form.role]}</p>
      </Card>
    </div>
  </div>;
}
function UserSecurity({record,onBack,onLocked}) {
  const [duration,setDuration]=useState(1),[unit,setUnit]=useState('day'),[reason,setReason]=useState('');
  const [otp,setOtp]=useState(''),[challenge,setChallenge]=useState(null), action=useAction();
  const locked=record.lockedUntil && new Date(record.lockedUntil)>new Date();
  const requestOtp=()=>action.run(async()=>{
    const response=await api('/admin/security/otp',{method:'POST'}); setChallenge(response.data); setOtp('');
  },'Mã OTP đã được gửi đến email quản trị viên.');
  const confirm=()=>action.run(async()=>{
    const response=await api('/users/'+record.id+(locked?'/unlock':'/temporary-lock'),{method:'POST',body:locked?
      {challengeId:challenge.challengeId,otp}:{duration:Number(duration),unit,reason:reason.trim(),challengeId:challenge.challengeId,otp}});
    onLocked(response.data);
  },locked?'Đã hủy khóa tài khoản.':'Đã khóa tài khoản tạm thời.');
  return <div className="user-security-page">
    <PageHead title="Khóa tài khoản tạm thời" text="Chọn thời hạn và ghi rõ lý do khóa tài khoản."><button className="btn" onClick={onBack}>Quay lại danh sách</button></PageHead>
    <Card title={record.fullName}><p>{roleNames[record.role]} · {record.phone} · {record.email||'Chưa có email'}</p>
      {locked && <div className="notice warning">Tài khoản đang bị khóa đến {date(record.lockedUntil)}. Xác nhận OTP quản trị để hủy khóa sớm.</div>}
      <ErrorBox error={action.error}/>
      {!locked && <><Field label="Lý do khóa"><textarea required minLength={5} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Nhập lý do thực tế cần khóa tài khoản"/></Field>
        <div className="form-grid"><Field label="Thời hạn khóa"><input type="number" min="1" max="365" step="1" value={duration} onChange={event=>setDuration(event.target.value)}/></Field>
        <Field label="Đơn vị thời hạn khóa"><select value={unit} onChange={event=>setUnit(event.target.value)}><option value="day">Ngày</option><option value="week">Tuần</option><option value="month">Tháng</option><option value="year">Năm</option></select></Field></div>
        <p>Kỹ thuật viên phải hoàn tất hoặc được điều phối lại công việc đang giữ trước khi khóa tài khoản.</p></>}
      <Field label="Mã OTP quản trị"><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,''))}/></Field>
      {challenge && <p>Mã xác thực đã gửi đến {challenge.destination || 'email quản trị viên'}.</p>}
      <div className="actions"><button className="btn" disabled={action.busy} onClick={requestOtp}>{challenge?'Gửi lại mã':'Nhận mã OTP'}</button>
        <button className="btn primary" disabled={action.busy||!challenge||otp.length!==6||(!locked&&reason.trim().length<5)} onClick={confirm}>{locked?'Xác nhận hủy khóa':'Xác nhận khóa tài khoản'}</button></div>
    </Card>
  </div>;
}
export function Management() { const { toast } = useApp(), { section } = useParams(); if (section === 'orders') return <AdminOrders />; if (section === 'users') return <AdminUsers />; const path = { services: '/admin/services', settings: '/settings', audit: '/audit-logs' }[section]; const r = useData(path), [edit, setEdit] = useState(null); const title = { services: 'Danh mục dịch vụ', settings: 'Cấu hình nghiệp vụ', audit: 'Nhật ký hệ thống' }[section]; const refresh = () => { r.reload(); toast('Đã gửi yêu cầu tải lại dữ liệu.'); }; return <><PageHead eyebrow="QUẢN TRỊ HOMEFIX" title={title || 'Quản trị'} text={section === 'audit' ? 'Các thao tác quan trọng được ghi lại để tra cứu.' : 'Điều chỉnh danh mục dịch vụ và các quy định vận hành.'}>{['services'].includes(section) && <button className="btn primary" onClick={() => setEdit({})}><Plus size={17} /> Thêm dịch vụ</button>}<button className="btn" onClick={refresh}><RefreshCw size={16} /> Cập nhật</button></PageHead><ErrorBox error={r.error} />{r.loading ? <Loading /> : <Card>{section === 'services' && <Table headers={['Dịch vụ', 'Nhóm', 'Phí kiểm tra / công', 'Hoa hồng', 'Trạng thái', '']} rows={r.data} render={s => <tr key={s.id}><td><b>{s.name}</b><small>{s.description}</small></td><td>{groups[s.groupCode]}</td><td>{money(s.inspectionFee)}<small>{money(s.laborFee)} tiền công</small></td><td>{Number(s.commissionRatePercent)}%</td><td><span className={'badge ' + (s.isActive ? 'green' : 'red')}>{s.isActive ? 'Đang cung cấp' : 'Đã ẩn'}</span></td><td><button className="btn small" onClick={() => setEdit(s)}><Pencil size={14} /> Sửa</button></td></tr>} />}{section === 'settings' && <Table headers={['Tham số', 'Giá trị', 'Thao tác']} rows={r.data} render={s => <tr key={s.key}><td><b>{s.label}</b><small>{s.key}</small></td><td>{s.key === 'signatureRequired' ? (s.value === 'true' ? 'Bắt buộc' : 'Không bắt buộc') : s.value}</td><td><button className="btn small" onClick={() => setEdit(s)}>Điều chỉnh</button></td></tr>} />}{section === 'audit' && <Table headers={['Thời gian', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'Chi tiết']} rows={r.data} render={a => <tr key={a.id}><td>{date(a.createdAt)}</td><td>{a.actorName || 'Hệ thống / trigger'}</td><td>{a.action}</td><td>{a.entity} #{a.entityId || '—'}</td><td>{a.detail || '—'}</td></tr>} />}</Card>}{section === 'settings' && <BankAccounts />}{edit && <Editor section={section} record={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); r.reload(); }} />}</>; }
function Editor({ section, record, onClose, onDone }) {
  const a = useAction(); const [form, setForm] = useState(section === 'users' ? { fullName: record.fullName || '', phone: record.phone || '', email: record.email || '', role: record.role || 'KH', initialPassword: '', isActive: record.isActive ?? true, skillGroup: 'DienLanh', serviceArea: 'TP.HCM' } : section === 'services' ? { name: record.name || '', groupCode: record.groupCode || 'DienLanh', description: record.description || '', inspectionFee: String(record.inspectionFee || '50000'), laborFee: String(record.laborFee || '300000'), commissionRatePercent: String(record.commissionRatePercent || '15'), isActive: record.isActive ?? true } : { value: record.value }); const set = (k, v) => setForm(s => ({ ...s, [k]: v })); const input = (k, label, type = 'text', required = true) => <Field label={label}><input type={type} required={required} value={form[k]} onChange={e => set(k, e.target.value)} /></Field>;
  return <Modal title={section === 'settings' ? 'Điều chỉnh ' + record.label : (record.id ? 'Cập nhật' : 'Thêm') + ' ' + (section === 'users' ? 'tài khoản' : 'dịch vụ')} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { let path, body; if (section === 'users') { path = '/users' + (record.id ? '/' + record.id : ''); body = record.id ? { fullName: form.fullName, role: form.role, skillGroup: form.skillGroup, isActive: form.isActive, expectedVersion: record.version } : { fullName: form.fullName, phone: form.phone, email: form.email || null, role: form.role, initialPassword: form.initialPassword, ...(form.role === 'KTV' ? { technicianProfile: { skillGroup: form.skillGroup, serviceArea: form.serviceArea } } : {}) }; } else if (section === 'services') { path = '/services' + (record.id ? '/' + record.id : ''); body = { ...form, ...(record.id ? { expectedVersion: record.version } : {}) }; } else { path = '/settings/' + record.key; body = { value: form.value, expectedVersion: record.version }; } await api(path, { method: record.id || section === 'settings' ? 'PATCH' : 'POST', body }); onDone(); }); }}><ErrorBox error={a.error} />{section === 'users' && <>{input('fullName', 'Họ và tên')}{!record.id && <>{input('phone', 'Số điện thoại')}{input('email', 'Email', 'email', false)}<Field label="Vai trò"><select value={form.role} onChange={e => set('role', e.target.value)}>{Object.entries(roleNames).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>{input('initialPassword', 'Mật khẩu ban đầu (từ 8 ký tự)', 'password')}{form.role === 'KTV' && <><Field label="Chuyên môn"><select value={form.skillGroup} onChange={e => set('skillGroup', e.target.value)}>{Object.entries(groups).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>{input('serviceArea', 'Khu vực phục vụ')}</>}</>}{record.id && <><p>{record.phone} · {roleNames[record.role]}</p><label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Tài khoản được hoạt động</label><small>Khóa tài khoản sẽ thu hồi các phiên đăng nhập.</small></>}</>}{section === 'services' && <>{input('name', 'Tên dịch vụ')}<Field label="Nhóm dịch vụ"><select value={form.groupCode} onChange={e => set('groupCode', e.target.value)}>{Object.entries(groups).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field><Field label="Mô tả"><textarea required minLength={5} value={form.description} onChange={e => set('description', e.target.value)} /></Field><div className="form-grid">{input('inspectionFee', 'Phí kiểm tra (đ)', 'number')}{input('laborFee', 'Tiền công (đ)', 'number')}{input('commissionRatePercent', 'Hoa hồng trên tiền công (%)', 'number')}</div><label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Dịch vụ đang được cung cấp</label><small>Giá mới áp dụng cho báo giá lập sau khi lưu. Không sửa chi phí đã được khách duyệt.</small></>}{section === 'settings' && (record.key === 'signatureRequired' ? <Field label="Yêu cầu chữ ký"><select value={form.value} onChange={e => set('value', e.target.value)}><option value="false">Không bắt buộc</option><option value="true">Bắt buộc ảnh chữ ký KH</option></select></Field> : input('value', 'Giá trị mới', 'number'))}<div className="form-actions"><button className="btn" type="button" onClick={onClose}>Hủy</button><Submit busy={a.busy} /></div></form></Modal>;
}
export function Finance() {
  const requestedTab = new URLSearchParams(useLocation().search).get('tab'), tab = ['revenue', 'bank', 'wallet'].includes(requestedTab) ? requestedTab : 'revenue', [selected, setSelected] = useState(null), exportAction = useAction();
  const settlements = useData(tab === 'revenue' || tab === 'wallet' ? '/settlements' : null, 15000), walletRequests = useData(tab === 'wallet' ? '/wallet-requests' : null, 15000);
  const reload = () => { settlements.reload(); walletRequests.reload(); };
  const download = () => exportAction.run(async () => { const blob = await api('/reports/finance.csv', { blob: true }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'HomeFix_DoiSoatDoanhThu.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'Đã tải báo cáo đối soát.');
  if (tab === 'revenue') return <RevenueReconciliation rows={settlements.data || []} loading={settlements.loading} error={settlements.error || exportAction.error} busy={exportAction.busy} onDownload={download} />;
  if (tab === 'bank') return <><PageHead eyebrow="TÀI CHÍNH HOMEFIX" title="Giao dịch chuyển khoản" text="Kiểm tra chứng từ và xác minh các khoản thanh toán chuyển khoản trước khi ghi nhận." /><BankPaymentQueue /></>;
  return <><PageHead eyebrow="TÀI CHÍNH HOMEFIX" title="Duyệt Ví KTV" text="Xử lý đối soát và các yêu cầu nạp, rút ví của kỹ thuật viên. Các thao tác ghi sổ được thực hiện tại đây." /><ErrorBox error={settlements.error || walletRequests.error} />
    <Card title="Đối soát thu hộ & khấu trừ hoa hồng"><Table headers={['Đơn dịch vụ', 'Kỹ thuật viên', 'Khoản đã thu', 'Hoa hồng', 'Trạng thái', 'Thao tác']} rows={settlements.data} render={s => <tr key={s.id}><td><Link to={'/orders/' + s.orderId}>{code(s.orderId)}</Link><small>{date(s.paidAt)}</small></td><td>{s.technicianName}</td><td>{money(s.amount)}<small>{s.method === 'BANK' ? 'HomeFix nhận chuyển khoản' : 'KTV nhận tiền mặt'}</small></td><td><b>{money(s.commissionAmount)}</b><small>{Number(s.commissionRatePercent)}% tiền công</small></td><td><Badge value={s.status} /></td><td>{s.status === 'Pending' && <button className="btn small primary" onClick={() => setSelected({ type: 'settlement', row: s })}>Đối soát</button>}</td></tr>} /></Card>
    <Card title="Yêu cầu nạp / rút ví"><Table headers={['Yêu cầu', 'Kỹ thuật viên', 'Số tiền', 'Trạng thái', 'Thao tác']} rows={walletRequests.data} render={w => <tr key={w.id}><td><b>{w.type === 'Deposit' ? 'Nạp ví' : 'Rút tiền'}</b><small>{date(w.createdAt)}</small></td><td>{w.technicianName}<small>{w.note}</small></td><td>{money(w.amount)}</td><td><Badge value={w.status} /></td><td><button className="btn small" onClick={() => setSelected({ type: 'wallet', row: w })}>{w.status === 'Pending' ? 'Xem & xử lý' : 'Xem chi tiết'}</button></td></tr>} /></Card>
    {selected && <FinanceDecision {...selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); reload(); }} />}
  </>;
}
function RevenueReconciliation({ rows = [], loading, error, busy, onDownload }) { const [query, setQuery] = useState(''), [status, setStatus] = useState('Pending'); const needle = query.trim().toLocaleLowerCase('vi'); const filtered = rows.filter(row => (status === 'All' || row.status === status) && (!needle || [code(row.orderId), row.technicianName, 'KTV-' + row.technicianId].some(value => String(value || '').toLocaleLowerCase('vi').includes(needle)))); const codTotal = rows.filter(row => row.method === 'COD').reduce((sum, row) => sum + Number(row.amount || 0), 0), commissionTotal = rows.reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0), pending = rows.filter(row => row.status === 'Pending').length, displayedTotal = filtered.reduce((sum, row) => sum + Number(row.amount || 0), 0), displayedMaterials = filtered.reduce((sum, row) => sum + Number(row.materialTotal || 0), 0), displayedLabor = filtered.reduce((sum, row) => sum + Number(row.laborFee || 0), 0), displayedCommission = filtered.reduce((sum, row) => sum + Number(row.commissionAmount || 0), 0); return <div className="reconciliation-page"><div className="reconciliation-heading"><div><div className="breadcrumb-text">HomeFix <span>›</span> Đối soát doanh thu</div><h1>Đối soát doanh thu, chiết khấu & tiền mặt COD</h1><p>Khấu trừ tiền ví kỹ thuật viên và kiểm tra số tiền mặt thu hộ khách hàng.</p></div><div className="reconciliation-actions"><button className="btn" disabled={busy} onClick={onDownload}><Download size={17} /> Xuất báo cáo</button><Link className="btn primary" to="/finance?tab=wallet"><Wallet size={17} /> Xác nhận đối soát</Link></div></div><ErrorBox error={error} /><section className="reconciliation-kpis"><ReconciliationKpi label="Tổng tiền mặt KTV thu COD" value={money(codTotal)} icon={<Wallet size={24} />} tone="green" /><ReconciliationKpi label="Tổng phí chiết khấu thu hồi" value={money(commissionTotal)} icon={<ShieldCheck size={24} />} tone="blue" /><ReconciliationKpi label="Số đơn chưa đối soát" value={`${pending} đơn hàng`} icon={<CheckCircle2 size={24} />} tone="red" /></section><section className="reconciliation-filter"><label>Trạng thái:<select value={status} onChange={event => setStatus(event.target.value)}><option value="Pending">Chưa đối soát</option><option value="Confirmed">Đã khấu trừ</option><option value="All">Tất cả</option></select></label><div><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Lọc theo mã thợ, tên kỹ thuật viên hoặc mã đơn hàng..." /></div></section>{loading ? <Loading /> : <div className="reconciliation-table table-wrap"><table><thead><tr><th>Mã đơn hàng</th><th>Mã KTV</th><th>Tên KTV</th><th>Tổng tiền khách trả</th><th>Tiền vật tư</th><th>Phí nhân công</th><th>% Chiết khấu</th><th>Số tiền trừ ví</th><th>Trạng thái</th></tr></thead><tbody>{filtered.length ? filtered.map(row => <tr key={row.id}><td><Link to={'/orders/' + row.orderId}>{code(row.orderId)}</Link></td><td>KTV-{row.technicianId}</td><td><b>{row.technicianName}</b></td><td>{money(row.amount)}</td><td>{money(row.materialTotal)}</td><td>{money(row.laborFee)}</td><td>{Number(row.commissionRatePercent || 0)}%</td><td><b>{money(row.commissionAmount)}</b></td><td><span className={'reconciliation-status ' + (row.status === 'Confirmed' ? 'confirmed' : 'pending')}>{row.status === 'Confirmed' ? 'Đã khấu trừ' : 'Chưa trừ'}</span></td></tr>) : <tr><td colSpan="9" className="reconciliation-empty">Chưa có đơn phù hợp với bộ lọc.</td></tr>}</tbody>{filtered.length > 0 && <tfoot><tr><td colSpan="3">Tổng kết dòng đơn hiển thị</td><td>{money(displayedTotal)}</td><td>{money(displayedMaterials)}</td><td>{money(displayedLabor)}</td><td>—</td><td>{money(displayedCommission)}</td><td>—</td></tr></tfoot>}</table></div>}</div>; }
function ReconciliationKpi({ label, value, icon, tone }) { return <article className={'reconciliation-kpi ' + tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function FinanceDecision({ type, row, onClose, onDone }) { const a = useAction(), requestKey = useRef(uuid()), [decision, setDecision] = useState('Approved'), [reason, setReason] = useState(''); return <Modal title={type === 'settlement' ? 'Xác nhận đối soát thanh toán' : 'Xử lý yêu cầu ví'} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { await api(type === 'settlement' ? `/settlements/${row.id}/confirm` : `/wallet-requests/${row.id}/decision`, { method: 'POST', body: type === 'settlement' ? { expectedVersion: row.version } : { decision, expectedVersion: row.version, ...(reason ? { reason } : {}) }, key: requestKey.current }); onDone(); }); }}><p><b>{row.technicianName}</b></p><div className="confirmation-amount">{money(type === 'settlement' ? (row.method === 'BANK' ? row.technicianCredit : row.commissionAmount) : row.amount)}</div>{type === 'settlement' ? <p>{row.method === 'BANK' ? 'HomeFix đã nhận chuyển khoản. Số tiền trên là phần thuộc KTV sau hoa hồng, gồm phí kiểm tra và vật tư; hệ thống cộng vào ví đúng một lần. KTV có thể yêu cầu rút tiền sau đó.' : 'KTV đã nhận tiền mặt trực tiếp. Hệ thống chỉ trừ hoa hồng từ ví đúng một lần, không cộng tiền mặt vào ví.'}</p> : <><p>{row.note}</p><Badge value={row.status} />{row.proofId && <div className="image-grid"><ProtectedImage id={row.proofId} alt="Chứng từ yêu cầu ví" /></div>}{row.status === 'Pending' && <><Field label="Kết quả xét duyệt"><select value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Đồng ý và ghi sổ</option><option value="Rejected">Từ chối</option></select></Field><Field label="Lý do / ghi chú"><textarea required={decision === 'Rejected'} value={reason} onChange={e => setReason(e.target.value)} /></Field><small>Đây là xét duyệt thủ công. Chỉ đồng ý khi đã kiểm tra chứng từ / việc chi tiền thực tế.</small></>}</>}<ErrorBox error={a.error} /><div className="form-actions"><button className="btn" type="button" onClick={onClose}>Đóng</button>{(type === 'settlement' || row.status === 'Pending') && <Submit busy={a.busy}>Xác nhận xử lý</Submit>}</div></form></Modal>; }
export function WalletPage() { const location = useLocation(), [revision, setRevision] = useState(0); const wallet = useData('/technicians/me/wallet'), income = useData('/technicians/me/income'), requests = useData('/wallet-requests'), a = useAction(); const [type, setType] = useState(new URLSearchParams(location.search).get('request') === 'Deposit' ? 'Deposit' : null); const refresh = () => { wallet.reload(); income.reload(); requests.reload(); setRevision(v => v + 1); }; return <><PageHead eyebrow="VÍ KỸ THUẬT VIÊN" title="Ví & thu nhập" text="Tiền chuyển khoản được cộng vào ví sau đối soát và trừ hoa hồng; tiền mặt đã nhận chỉ trừ hoa hồng."><button className="btn" onClick={refresh}><RefreshCw size={16} /> Cập nhật</button></PageHead><ErrorBox error={wallet.error || requests.error || a.error} /><section className="wallet-hero"><span>Số dư ví hiện tại</span><strong>{money(wallet.data?.balance)}</strong><div className="actions"><button className="btn white" onClick={() => setType('Deposit')}><Plus size={17} /> Nạp ví</button><button className="btn glass" onClick={() => setType('Withdrawal')}><ArrowUpFromLine size={17} /> Yêu cầu rút</button></div></section><div className="stat-grid three"><Stat label="Thu nhập trước chi phí khác" value={money(income.data?.income)} icon={Wallet} /><Stat label="Hoàn chi vật tư" value={money(income.data?.materialReimbursement)} icon={ShieldCheck} /><Stat label="Đơn đã thu tiền" value={income.data?.completedOrders || 0} /></div><Card title="Yêu cầu nạp / rút"><Table headers={['Loại yêu cầu', 'Số tiền', 'Thời gian', 'Trạng thái', '']} rows={requests.data} render={r => <tr key={r.id}><td>{r.type === 'Deposit' ? 'Nạp ví' : 'Rút tiền'}<small>{r.note}</small></td><td>{money(r.amount)}</td><td>{date(r.createdAt)}</td><td><Badge value={r.status} />{r.reason && <small>{r.reason}</small>}</td><td>{r.status === 'Pending' && <button className="btn small danger" disabled={a.busy} onClick={() => a.run(async () => { await api(`/wallet-requests/${r.id}/cancel`, { method: 'POST', body: { expectedVersion: r.version } }); refresh(); })}>Hủy yêu cầu</button>}</td></tr>} /></Card><WalletHistory revision={revision} />{type && <WalletRequest key={type} type={type} balance={wallet.data?.balance} onTypeChange={setType} onClose={() => setType(null)} onDone={() => { setType(null); refresh(); }} />}</>; }
function WalletRequest({ type, balance, onTypeChange, onClose, onDone }) {
 const a = useAction(), [amount, setAmount] = useState(''), [note, setNote] = useState(''), [bank, setBank] = useState({ name: '', account: '', holder: '' }), [file, setFile] = useState(null), proof = useRef(null), requestKey = useRef(uuid());
 return <Modal title={type === 'Deposit' ? 'Yêu cầu nạp ví' : 'Yêu cầu rút tiền'} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => {
  if (type === 'Withdrawal' && Number(amount) > Number(balance)) throw new Error('Số tiền rút vượt số dư ví.');
  if (file && !proof.current) proof.current = (await upload(file, 'WalletProof')).id;
  await api('/wallet-requests', { method: 'POST', body: { type, amount, note: type === 'Withdrawal' ? `${bank.name} · STK ${bank.account} · ${bank.holder}. ${note}` : note, ...(proof.current ? { proofId: proof.current } : {}) }, key: requestKey.current }); onDone();
 }); }}>
 <div className="segmented-control">{[['Deposit','Nạp tiền'],['Withdrawal','Rút tiền']].map(([key,name]) => <button key={key} type="button" disabled={a.busy} className={'btn ' + (type === key ? 'primary' : '')} onClick={() => onTypeChange(key)}>{name}</button>)}</div>
 <div className="notice info">Yêu cầu được kế toán xét duyệt. Số dư chỉ thay đổi sau khi duyệt; chưa hỗ trợ chuyển tiền tức thì.</div>
 <Field label="Số tiền (đ)"><input required min="1" max={type === 'Withdrawal' ? Math.min(Number(balance || 0),100000000) : 100000000} step="1" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
 <div className="quick-amounts">{[500000,1000000,2500000].map(v => <button key={v} className="btn" type="button" disabled={type === 'Withdrawal' && v > Number(balance)} onClick={() => setAmount(String(v))}>{money(v)}</button>)}{type === 'Withdrawal' && <button type="button" className="btn" onClick={() => setAmount(String(Math.min(Number(balance || 0),100000000)))}>Tất cả</button>}</div>
 {type === 'Withdrawal' && <><p>Số dư hiện tại: <b>{money(balance)}</b></p><Field label="Ngân hàng nhận tiền"><input required maxLength={100} value={bank.name} onChange={e => setBank({ ...bank,name:e.target.value })} /></Field><Field label="Số tài khoản nhận tiền"><input required inputMode="numeric" pattern="[0-9]{6,30}" value={bank.account} onChange={e => setBank({ ...bank,account:e.target.value })} /></Field><Field label="Chủ tài khoản"><input required maxLength={100} value={bank.holder} onChange={e => setBank({ ...bank,holder:e.target.value })} /></Field></>}
 <Field label={type === 'Withdrawal' ? 'Ghi chú rút tiền' : 'Nội dung nạp ví'}><textarea required={type === 'Deposit'} minLength={type === 'Deposit' ? 5 : 0} maxLength={600} value={note} onChange={e => setNote(e.target.value)} /></Field>
 {type === 'Deposit' && <Field label="Ảnh chứng từ"><input required type="file" accept="image/png,image/jpeg" onChange={e => {setFile(e.target.files[0]);proof.current=null;}} /></Field>}
 <ErrorBox error={a.error} /><div className="form-actions"><button className="btn" type="button" disabled={a.busy} onClick={onClose}>Quay lại</button><Submit busy={a.busy}>Gửi yêu cầu</Submit></div></form></Modal>;
}
/* ================================================================
   MODULE CSKH — CHĂM SÓC KHÁCH HÀNG
   Screens: Dashboard | Ticket List | Create Complaint | Create Warranty | Ticket Detail
   ================================================================ */

// ── Shared helpers ────────────────────────────────────────────────
const TICKET_TYPE_LABELS = { Complaint: 'Khiếu nại', Warranty: 'Bảo hành' };
const PRIORITY_LABELS = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Urgent: 'Khẩn cấp' };
const CONTACT_TYPE_LABELS = { Call: 'Cuộc gọi', Chat: 'Tin nhắn/Chat', Internal: 'Ghi chú nội bộ', Meeting: 'Gặp trực tiếp' };

function StarRow({ rating }) {
  return (
    <span style={{ color: '#f59e0b', letterSpacing: '1px' }}>
      {[1,2,3,4,5].map(i => <Star key={i} size={13} fill={i <= rating ? '#f59e0b' : 'none'} />)}
    </span>
  );
}

// ── Screen 1: Dashboard CSKH ──────────────────────────────────────
function CSKHDashboard({ onNavigate }) {
  const r = useData('/support/summary', 30000);
  const d = r.data;
  return (
    <>
      <PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Tổng quan CSKH" text="Theo dõi phiếu hỗ trợ, khiếu nại và đánh giá chất lượng dịch vụ.">
        <Link className="btn" to="/support/messages">Hộp thư hỗ trợ</Link>
        <button className="btn primary" onClick={() => onNavigate('create-complaint')}>
          <Plus size={16} /> Lập phiếu khiếu nại
        </button>
        <button className="btn" onClick={() => onNavigate('create-warranty')}>
          <ShieldCheck size={16} /> Lập phiếu bảo hành
        </button>
      </PageHead>
      <ErrorBox error={r.error} />
      {r.loading ? <Loading /> : d && (
        <>
          <div className="stat-grid">
            <div className="stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('tickets', { status: 'Open' })}>
              <span><AlertTriangle size={20} style={{ color: '#ef4444' }} /></span>
              <div><b>{d.openComplaints}</b><small>Khiếu nại đang mở</small></div>
            </div>
            <div className="stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('tickets', { type: 'Warranty' })}>
              <span><ShieldCheck size={20} style={{ color: '#3b82f6' }} /></span>
              <div><b>{d.openWarranties}</b><small>Phiếu bảo hành đang mở</small></div>
            </div>
            <div className="stat">
              <span><ThumbsDown size={20} style={{ color: '#f59e0b' }} /></span>
              <div><b>{d.lowReviewsCount}</b><small>Đánh giá kém (≤3 sao)</small></div>
            </div>
            <div className="stat">
              <span><Star size={20} style={{ color: '#10b981' }} /></span>
              <div><b>{d.averageRating}/5</b><small>Điểm đánh giá TB ({d.totalReviewsCount} đánh giá)</small></div>
            </div>
          </div>
          <div className="two-column">
            <Card title="Phiếu hỗ trợ cần xử lý">
              {d.recentTickets?.length ? (
                <div className="timeline">
                  {d.recentTickets.map(t => (
                    <div key={t.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f3f4' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.status === 'Open' ? '#ef4444' : t.status === 'InProgress' ? '#f59e0b' : '#10b981', flexShrink: 0, marginTop: '5px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <b style={{ fontSize: '13px' }}>HT-{t.id} · {TICKET_TYPE_LABELS[t.type] || t.type}</b>
                          <Badge value={t.status} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>{t.customerName} — {code(t.orderId)}</div>
                        <div style={{ fontSize: '12px', color: '#5f6368' }}>{t.serviceName}</div>
                      </div>
                      <button className="btn small" onClick={() => onNavigate('ticket-detail', { id: t.id })}>Xem</button>
                    </div>
                  ))}
                </div>
              ) : <Empty title="Không có phiếu cần xử lý" text="Tất cả phiếu đã được giải quyết." />}
              <button className="btn" style={{ marginTop: '12px', width: '100%' }} onClick={() => onNavigate('tickets')}>Xem tất cả phiếu hỗ trợ</button>
            </Card>
            <Card title="Đánh giá kém gần đây">
              {d.recentLowReviews?.length ? (
                <div>
                  {d.recentLowReviews.map(rv => (
                    <div key={rv.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f3f4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ fontSize: '13px' }}>{rv.customerName}</b>
                        <StarRow rating={rv.rating} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>{rv.serviceName} · KTV: {rv.technicianName}</div>
                      {rv.comment && <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#374151', fontStyle: 'italic' }}>"{rv.comment}"</p>}
                      <button className="btn small" style={{ marginTop: '6px' }} onClick={() => onNavigate('create-complaint-from-review', { orderId: rv.orderId })}>Lập phiếu khiếu nại</button>
                    </div>
                  ))}
                </div>
              ) : <Empty title="Chưa có đánh giá kém" text="Không có đánh giá ≤3 sao gần đây." />}
              <button className="btn" style={{ marginTop: '12px', width: '100%' }} onClick={() => onNavigate('reviews')}>Xem tất cả đánh giá</button>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

// ── Screen 2: Danh sách phiếu hỗ trợ ─────────────────────────────
function CSKHTicketList({ onNavigate }) {
  const [filter, setFilter] = useState({ type: 'All', status: 'All', q: '', page: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const qp = new URLSearchParams();
  if (filter.type !== 'All') qp.set('type', filter.type);
  if (filter.status !== 'All') qp.set('status', filter.status);
  if (filter.q) qp.set('q', filter.q);
  qp.set('page', filter.page); qp.set('pageSize', 15);
  const r = useData('/support/tickets?' + qp.toString(), 20000);
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  return (
    <>
      <PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Danh sách phiếu hỗ trợ" text="Tất cả phiếu khiếu nại và bảo hành. Nhấn vào hàng để xem chi tiết và cập nhật.">
        <button className="btn primary" onClick={() => onNavigate('create-complaint')}><Plus size={16} /> Khiếu nại</button>
        <button className="btn" onClick={() => onNavigate('create-warranty')}><ShieldCheck size={16} /> Bảo hành</button>
        <button className="btn" onClick={() => onNavigate('dashboard')}><History size={16} /> Dashboard</button>
      </PageHead>
      <div className="filter-bar">
        <Field label="Tìm kiếm"><input type="search" placeholder="Mã phiếu, đơn, tên KH..." value={filter.q} onChange={e => set('q', e.target.value)} /></Field>
        <Field label="Loại phiếu"><select value={filter.type} onChange={e => set('type', e.target.value)}>
          <option value="All">Tất cả</option>
          <option value="Complaint">Khiếu nại</option>
          <option value="Warranty">Bảo hành</option>
        </select></Field>
        <Field label="Trạng thái"><select value={filter.status} onChange={e => set('status', e.target.value)}>
          <option value="All">Tất cả</option>
          <option value="Open">Mới tiếp nhận</option>
          <option value="InProgress">Đang xử lý</option>
          <option value="Resolved">Đã giải quyết</option>
          <option value="Rejected">Từ chối</option>
        </select></Field>
        <button className="btn" onClick={() => setFilter({ type: 'All', status: 'All', q: '', page: 1 })}><RefreshCw size={14} /> Đặt lại</button>
      </div>
      <ErrorBox error={r.error} />
      {r.loading ? <Loading /> : (
        <Card>
          <Table
            headers={['Phiếu', 'Khách hàng & Đơn', 'Nội dung', 'KTV', 'Trạng thái', 'Cập nhật', '']}
            rows={r.data}
            empty="Không tìm thấy phiếu nào."
            render={t => (
              <tr key={t.id}>
                <td>
                  <b>HT-{t.id}</b>
                  <small style={{ display: 'block' }}>
                    <span className={t.type === 'Warranty' ? 'badge green' : 'badge amber'}>{TICKET_TYPE_LABELS[t.type]}</span>
                  </small>
                </td>
                <td>
                  <b>{t.customerName}</b>
                  <small><Link to={'/orders/' + t.orderId}>{code(t.orderId)}</Link></small>
                  <small>{t.customerPhone}</small>
                </td>
                <td style={{ maxWidth: '220px' }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '12px' }}>{t.description}</span>
                </td>
                <td>{t.technicianName || '—'}</td>
                <td><Badge value={t.status} /></td>
                <td>{date(t.updatedAt || t.createdAt)}</td>
                <td>
                  <button className="btn small primary" onClick={() => setSelectedId(t.id)}>Chi tiết</button>
                </td>
              </tr>
            )}
          />
        </Card>
      )}
      <div className="pagination">
        <button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button>
        <span>Trang {filter.page}{r.meta?.total ? ` / ${Math.ceil(r.meta.total / 15)} (${r.meta.total} phiếu)` : ''}</span>
        <button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button>
      </div>
      {selectedId && (
        <CSKHTicketDetail
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onDone={() => { setSelectedId(null); r.reload(); }}
        />
      )}
    </>
  );
}

// ── Screen 3: Tạo phiếu khiếu nại ────────────────────────────────
function CSKHCreateComplaint({ onBack, prefillOrderId }) {
  const { toast } = useApp();
  const a = useAction();
  const [searchFields, setSearchFields] = useState({ orderId: prefillOrderId ? String(prefillOrderId) : '', phone: '', name: '' });
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ description: '', category: '', priority: 'Medium', initialAction: '' });
  const debounceRef = useRef(null);

  useEffect(() => {
    if (prefillOrderId) runSearch(String(prefillOrderId));
  }, []);

  const runSearch = async q => {
    if (!q || !q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api('/support/orders/search?q=' + encodeURIComponent(q.trim()));
      setSearchResults(res.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleFieldSearch = (field, value) => {
    setSearchFields(s => ({ ...s, [field]: value }));
    setSelectedOrder(null);
    clearTimeout(debounceRef.current);
    if (!value || !value.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearchQ(value);
      runSearch(value);
    }, 300);
  };

  const doFieldSearch = field => {
    clearTimeout(debounceRef.current);
    const v = searchFields[field];
    setSearchQ(v);
    runSearch(v);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedOrder) return;
    await a.run(async () => {
      await api('/support/tickets', {
        method: 'POST',
        body: {
          orderId: selectedOrder.id,
          type: 'Complaint',
          description: form.description,
          category: form.category || undefined,
          priority: form.priority || undefined,
          initialAction: form.initialAction || undefined
        }
      });
      toast('Đã tạo phiếu khiếu nại thành công.');
      onBack();
    });
  };

  return (
    <>
      <PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Tiếp nhận & Tạo phiếu khiếu nại" text="Tìm đơn hàng theo mã đơn, số điện thoại hoặc tên khách hàng, sau đó điền thông tin khiếu nại.">
        <button className="btn" onClick={onBack}>← Quay lại</button>
      </PageHead>

      <Card title="Bước 1 — Tìm & chọn đơn hàng">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Mã đơn</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="VD: HF-00012"
                value={searchFields.orderId}
                onChange={e => handleFieldSearch('orderId', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('orderId')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('orderId')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Số điện thoại</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="tel"
                placeholder="VD: 0912345678"
                value={searchFields.phone}
                onChange={e => handleFieldSearch('phone', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('phone')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('phone')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Tên khách hàng</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={searchFields.name}
                onChange={e => handleFieldSearch('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('name')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('name')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
        </div>
        {searching && <Loading />}
        {!searching && searchResults.length > 0 && !selectedOrder && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
            {searchResults.map(o => (
              <div
                key={o.id}
                onClick={() => { setSelectedOrder(o); setSearchResults([]); }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f3f4', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><b>{code(o.id)}</b> — {o.contactName}</span>
                  <Badge value={o.status} />
                </div>
                <small style={{ color: '#6b7280' }}>{o.serviceName} · {o.contactPhone}</small>
                {o.activeTicketsCount > 0 && <small style={{ color: '#ef4444', display: 'block' }}>⚠ Đang có {o.activeTicketsCount} phiếu hỗ trợ mở</small>}
              </div>
            ))}
          </div>
        )}
        {!searching && searchResults.length === 0 && searchQ && !selectedOrder && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Không tìm thấy đơn hàng phù hợp.</div>
        )}
        {selectedOrder && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <b>{code(selectedOrder.id)}</b> — {selectedOrder.contactName}
                <small style={{ display: 'block', color: '#6b7280' }}>{selectedOrder.serviceName} · {selectedOrder.contactPhone}</small>
                {selectedOrder.technicianName && <small style={{ display: 'block', color: '#6b7280' }}>KTV: {selectedOrder.technicianName}</small>}
                {selectedOrder.activeTicketsCount > 0 && <small style={{ display: 'block', color: '#ef4444', marginTop: '4px' }}>⚠ Đã có {selectedOrder.activeTicketsCount} phiếu hỗ trợ đang mở cho đơn này</small>}
              </div>
              <button className="btn small" onClick={() => { setSelectedOrder(null); setSearchResults([]); setSearchFields({ orderId: '', phone: '', name: '' }); }}>Đổi đơn</button>
            </div>
          </div>
        )}
      </Card>

      {selectedOrder && (
        <Card title="Bước 2 — Thông tin khiếu nại">
          <form onSubmit={handleSubmit}>
            <Field label="Danh mục khiếu nại" hint="Ví dụ: Thái độ KTV, Chất lượng sửa chữa, Báo giá sai, Không đến đúng hẹn...">
              <input type="text" maxLength={80} placeholder="Nhập danh mục (không bắt buộc)" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} />
            </Field>
            <Field label="Mức ưu tiên">
              <select value={form.priority} onChange={e => setForm(s => ({ ...s, priority: e.target.value }))}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Nội dung khiếu nại" hint="Mô tả chi tiết sự việc theo lời khách hàng (tối thiểu 10 ký tự).">
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="Khách hàng phản ánh..."
                value={form.description}
                onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              />
            </Field>
            <Field label="Ghi chú tiếp nhận ban đầu" hint="Bước đã thực hiện, cam kết với khách, v.v. (không bắt buộc).">
              <textarea
                maxLength={1000}
                rows={3}
                placeholder="Đã hứa phản hồi trong vòng 24h..."
                value={form.initialAction}
                onChange={e => setForm(s => ({ ...s, initialAction: e.target.value }))}
              />
            </Field>
            <ErrorBox error={a.error} />
            <div className="form-actions">
              <Submit busy={a.busy}>Lập phiếu khiếu nại</Submit>
              <button type="button" className="btn" onClick={onBack}>Hủy</button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

// ── Screen 4: Khởi tạo phiếu bảo hành ───────────────────────────
function CSKHCreateWarranty({ onBack }) {
  const { toast } = useApp();
  const a = useAction();
  const [searchFields, setSearchFields] = useState({ orderId: '', phone: '', name: '' });
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [warrantyInfo, setWarrantyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [form, setForm] = useState({ description: '', initialAction: '' });
  const debounceRef = useRef(null);

  const runSearch = async q => {
    if (!q || !q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api('/support/orders/search?q=' + encodeURIComponent(q.trim()));
      setSearchResults(res.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const selectOrder = async o => {
    setSelectedOrder(o);
    setSearchResults([]);
    setLoadingInfo(true);
    try {
      const res = await api('/support/orders/' + o.id + '/warranty-info');
      setWarrantyInfo(res.data);
    } catch { setWarrantyInfo(null); }
    finally { setLoadingInfo(false); }
  };

  const handleFieldSearch = (field, value) => {
    setSearchFields(s => ({ ...s, [field]: value }));
    setSelectedOrder(null);
    setWarrantyInfo(null);
    clearTimeout(debounceRef.current);
    if (!value || !value.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearchQ(value);
      runSearch(value);
    }, 300);
  };

  const doFieldSearch = field => {
    clearTimeout(debounceRef.current);
    const v = searchFields[field];
    setSearchQ(v);
    runSearch(v);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedOrder) return;
    await a.run(async () => {
      await api('/support/tickets', {
        method: 'POST',
        body: { orderId: selectedOrder.id, type: 'Warranty', description: form.description, initialAction: form.initialAction || undefined }
      });
      toast('Đã khởi tạo phiếu bảo hành thành công.');
      onBack();
    });
  };

  const wi = warrantyInfo;
  const serviceOk = wi?.isServiceWarrantyValid;
  const materialOk = wi?.materials?.some(m => m.isUnderWarranty);
  const canWarranty = serviceOk || materialOk;

  return (
    <>
      <PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Khởi tạo phiếu bảo hành dịch vụ" text="Tra cứu đơn và kiểm tra điều kiện bảo hành trước khi lập phiếu.">
        <button className="btn" onClick={onBack}>← Quay lại</button>
      </PageHead>

      <Card title="Bước 1 — Tìm đơn hàng">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Mã đơn</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="VD: HF-00012"
                value={searchFields.orderId}
                onChange={e => handleFieldSearch('orderId', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('orderId')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('orderId')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Số điện thoại</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="tel"
                placeholder="VD: 0912345678"
                value={searchFields.phone}
                onChange={e => handleFieldSearch('phone', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('phone')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('phone')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Tên khách hàng</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={searchFields.name}
                onChange={e => handleFieldSearch('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doFieldSearch('name')}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button className="btn small" onClick={() => doFieldSearch('name')} style={{ whiteSpace: 'nowrap' }}>Tìm</button>
            </div>
          </div>
        </div>
        {searching && <Loading />}
        {!searching && searchResults.length > 0 && !selectedOrder && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
            {searchResults.map(o => (
              <div key={o.id} onClick={() => selectOrder(o)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f3f4' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><b>{code(o.id)}</b> — {o.contactName}</span>
                  <Badge value={o.status} />
                </div>
                <small style={{ color: '#6b7280' }}>{o.serviceName} · {o.contactPhone}</small>
                {o.acceptanceDate && <small style={{ color: '#10b981', display: 'block' }}>✓ Đã nghiệm thu: {date(o.acceptanceDate)}</small>}
              </div>
            ))}
          </div>
        )}
        {!searching && searchResults.length === 0 && searchQ && !selectedOrder && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Không tìm thấy đơn hàng phù hợp.</div>
        )}
        {selectedOrder && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <b>{code(selectedOrder.id)}</b> — {selectedOrder.contactName} ({selectedOrder.contactPhone})
                <small style={{ display: 'block', color: '#6b7280' }}>{selectedOrder.serviceName}</small>
              </div>
              <button className="btn small" onClick={() => { setSelectedOrder(null); setWarrantyInfo(null); setSearchResults([]); setSearchFields({ orderId: '', phone: '', name: '' }); }}>Đổi</button>
            </div>
          </div>
        )}
      </Card>

      {selectedOrder && (
        <Card title="Bước 2 — Thông tin bảo hành">
          {loadingInfo ? <Loading /> : wi ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280', marginBottom: '10px' }}>Điều kiện bảo hành</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px', padding: '12px', background: serviceOk ? '#f0fdf4' : '#fef2f2', border: '1px solid ' + (serviceOk ? '#bbf7d0' : '#fecaca'), borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: serviceOk ? '#15803d' : '#dc2626' }}>
                      {serviceOk ? '✓' : '✗'} Bảo hành tay nghề / dịch vụ
                    </div>
                    <small style={{ color: '#6b7280' }}>
                      {wi.serviceWarrantyExpiresAt
                        ? (serviceOk ? `Còn hạn đến ${date(wi.serviceWarrantyExpiresAt)}` : `Đã hết hạn (${date(wi.serviceWarrantyExpiresAt)})`)
                        : 'Chưa nghiệm thu'}
                    </small>
                    <small style={{ display: 'block', color: '#9ca3af' }}>Tiêu chuẩn: 30 ngày kể từ nghiệm thu</small>
                  </div>
                  {wi.materials?.length > 0 && (
                    <div style={{ flex: 1, minWidth: '200px', padding: '12px', background: materialOk ? '#f0fdf4' : '#fef2f2', border: '1px solid ' + (materialOk ? '#bbf7d0' : '#fecaca'), borderRadius: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: materialOk ? '#15803d' : '#dc2626' }}>
                        {materialOk ? '✓' : '✗'} Bảo hành vật tư / linh kiện
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        {wi.materials.map(m => (
                          <div key={m.id} style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {m.name}: {m.isUnderWarranty ? <span style={{ color: '#15803d' }}>còn hạn đến {date(m.warrantyExpiresAt)}</span> : <span style={{ color: '#dc2626' }}>hết hạn</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {!canWarranty && (
                  <div className="notice" style={{ marginTop: '12px', background: '#fef9c3', borderColor: '#fde68a' }}>
                    <AlertTriangle size={16} /> Đơn này đã hết thời hạn bảo hành. CSKH vẫn có thể lập phiếu theo thẩm quyền.
                  </div>
                )}
              </div>
              {wi.existingTickets?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <small style={{ fontWeight: '600', display: 'block', marginBottom: '6px', color: '#ef4444' }}>⚠ Phiếu hỗ trợ đã tồn tại cho đơn này:</small>
                  {wi.existingTickets.map(t => (
                    <span key={t.id} style={{ display: 'inline-block', marginRight: '8px', marginBottom: '4px' }}>
                      <Badge value={t.status} /> HT-{t.id} ({TICKET_TYPE_LABELS[t.type]})
                    </span>
                  ))}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <Field label="Mô tả yêu cầu bảo hành" hint="Lỗi cụ thể, bộ phận, thời điểm xảy ra... (tối thiểu 10 ký tự).">
                  <textarea required minLength={10} maxLength={2000} rows={5} placeholder="Khách phản ánh thiết bị lại hỏng sau khi sửa..." value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
                </Field>
                <Field label="Ghi chú tiếp nhận" hint="Không bắt buộc">
                  <textarea maxLength={1000} rows={3} placeholder="Đã hẹn KTV kiểm tra lại vào..." value={form.initialAction} onChange={e => setForm(s => ({ ...s, initialAction: e.target.value }))} />
                </Field>
                <ErrorBox error={a.error} />
                <div className="form-actions">
                  <Submit busy={a.busy}>Lập phiếu bảo hành</Submit>
                  <button type="button" className="btn" onClick={onBack}>Hủy</button>
                </div>
              </form>
            </>
          ) : <div className="notice" style={{ background: '#fef2f2' }}><AlertTriangle size={16} /> Không thể tra cứu thông tin bảo hành. Đơn có thể chưa nghiệm thu hoặc có lỗi kết nối.</div>}
        </Card>
      )}
    </>
  );
}

// ── Screen 5: Chi tiết phiếu + Cập nhật / Đóng / Hủy ─────────────
function CSKHTicketDetail({ id, onClose, onDone }) {
  const { user } = useApp();
  const r = useData('/support/tickets/' + id);
  const a = useAction();
  const [noteForm, setNoteForm] = useState({ note: '', contactType: 'Call' });
  const [statusForm, setStatusForm] = useState({ status: 'InProgress', resolution: '', actionType: '' });
  const [tab, setTab] = useState('history');

  const submitNote = async e => {
    e.preventDefault();
    await a.run(async () => {
      await api('/support/tickets/' + id + '/notes', { method: 'POST', body: { note: noteForm.note, contactType: noteForm.contactType } });
      setNoteForm(s => ({ ...s, note: '' }));
      r.reload();
    });
  };

  const submitStatus = async e => {
    e.preventDefault();
    await a.run(async () => {
      await api('/support/tickets/' + id, {
        method: 'PATCH',
        body: { status: statusForm.status, resolution: statusForm.resolution, actionType: statusForm.actionType || undefined, expectedVersion: r.data.version }
      });
      onDone();
    });
  };

  const t = r.data;
  const canUpdate = user.role === 'CSKH' && t && ['Open', 'InProgress'].includes(t.status);

  return (
    <Modal title={`Phiếu HT-${id} — ${t ? TICKET_TYPE_LABELS[t.type] || t.type : '...'}`} onClose={onClose}>
      <ErrorBox error={r.error || a.error} />
      {r.loading ? <Loading /> : t && (
        <>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <small style={{ color: '#6b7280', display: 'block' }}>Khách hàng</small>
              <b>{t.order?.customerName}</b>
              <small style={{ display: 'block', color: '#6b7280' }}>{t.order?.customerPhone}</small>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <small style={{ color: '#6b7280', display: 'block' }}>Đơn dịch vụ</small>
              <Link to={'/orders/' + t.orderId}><b>{code(t.orderId)}</b></Link>
              <small style={{ display: 'block', color: '#6b7280' }}>{t.order?.serviceName}</small>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <small style={{ color: '#6b7280', display: 'block' }}>KTV thực hiện</small>
              <b>{t.order?.technicianName || '—'}</b>
              <small style={{ display: 'block', color: '#6b7280' }}>{t.order?.technicianPhone || ''}</small>
            </div>
            <div>
              <small style={{ color: '#6b7280', display: 'block' }}>Trạng thái</small>
              <Badge value={t.status} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <small style={{ fontWeight: '600', display: 'block', marginBottom: '4px', color: '#6b7280', textTransform: 'uppercase', fontSize: '11px' }}>Nội dung yêu cầu</small>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '13px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', margin: 0 }}>{t.description}</p>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '2px solid #e5e7eb' }}>
            {[['history', <History key="h" size={14} />, 'Lịch sử'], ['note', <MessageSquare key="m" size={14} />, 'Ghi chú / Liên hệ'], canUpdate && ['update', <ClipboardCheck key="c" size={14} />, 'Cập nhật / Đóng phiếu']].filter(Boolean).map(([key, icon, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ padding: '7px 12px', fontSize: '12px', fontWeight: tab === key ? '700' : '400', color: tab === key ? '#2563eb' : '#6b7280', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '-2px' }}>
                {icon}{label}
              </button>
            ))}
          </div>

          {tab === 'history' && (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {t.history?.length ? t.history.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '5px' }} />
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <b style={{ fontSize: '12px' }}>{labels[h.status] || h.status}</b>
                      <small style={{ color: '#6b7280' }}>{h.actorName} ({h.actorRole})</small>
                    </div>
                    <p style={{ fontSize: '12px', margin: '2px 0', whiteSpace: 'pre-wrap' }}>{h.note}</p>
                    <small style={{ color: '#9ca3af' }}>{date(h.createdAt)}</small>
                  </div>
                </div>
              )) : <Empty title="Chưa có lịch sử" />}
            </div>
          )}

          {tab === 'note' && (
            <form onSubmit={submitNote}>
              <Field label="Loại tương tác">
                <select value={noteForm.contactType} onChange={e => setNoteForm(s => ({ ...s, contactType: e.target.value }))}>
                  {Object.entries(CONTACT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Nội dung ghi chú / kết quả liên hệ" hint="Tối thiểu 3 ký tự">
                <textarea required minLength={3} maxLength={2000} rows={4} value={noteForm.note} onChange={e => setNoteForm(s => ({ ...s, note: e.target.value }))} placeholder="Đã gọi cho khách, khách cho biết..." />
              </Field>
              <ErrorBox error={a.error} />
              <Submit busy={a.busy}>Lưu ghi chú</Submit>
            </form>
          )}

          {tab === 'update' && canUpdate && (
            <form onSubmit={submitStatus}>
              <Field label="Trạng thái mới">
                <select value={statusForm.status} onChange={e => setStatusForm(s => ({ ...s, status: e.target.value }))}>
                  <option value="InProgress">Đang xử lý (tiếp tục theo dõi)</option>
                  <option value="Resolved">Đã giải quyết — Đóng phiếu</option>
                  <option value="Rejected">Từ chối — Có lý do</option>
                </select>
              </Field>
              <Field label="Phương án xử lý" hint="Không bắt buộc — ví dụ: Hẹn lịch KTV kiểm tra lại, Hoàn tiền một phần...">
                <input type="text" maxLength={80} placeholder="Phương án cụ thể..." value={statusForm.actionType} onChange={e => setStatusForm(s => ({ ...s, actionType: e.target.value }))} />
              </Field>
              <Field label="Kết quả / Lý do" hint="Mô tả chi tiết. Sẽ gửi thông báo đến khách hàng (tối thiểu 5 ký tự).">
                <textarea required minLength={5} maxLength={2000} rows={5} placeholder="Đã xác nhận với KTV... / Đã hoàn tiền... / Khiếu nại không có căn cứ vì..." value={statusForm.resolution} onChange={e => setStatusForm(s => ({ ...s, resolution: e.target.value }))} />
              </Field>
              <ErrorBox error={a.error} />
              <div className="form-actions">
                <Submit busy={a.busy}>Xác nhận cập nhật</Submit>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}

// ── Screen: Danh sách đánh giá ────────────────────────────────────
function CSKHReviews({ onBack }) {
  const [filter, setFilter] = useState({ maxRating: '3', q: '', page: 1 });
  const qp = new URLSearchParams();
  if (filter.maxRating) qp.set('maxRating', filter.maxRating);
  if (filter.q) qp.set('q', filter.q);
  qp.set('page', filter.page); qp.set('pageSize', 15);
  const r = useData('/support/reviews?' + qp.toString(), 20000);
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  return (
    <>
      <PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Đánh giá khách hàng" text="Theo dõi chất lượng phản hồi. Lọc nhanh đánh giá kém để chăm sóc kịp thời.">
        <button className="btn" onClick={onBack}>← Quay lại</button>
      </PageHead>
      <div className="filter-bar">
        <Field label="Tìm kiếm"><input type="search" placeholder="Tên KH, KTV, nội dung..." value={filter.q} onChange={e => set('q', e.target.value)} /></Field>
        <Field label="Lọc theo sao">
          <select value={filter.maxRating} onChange={e => set('maxRating', e.target.value)}>
            <option value="">Tất cả đánh giá</option>
            <option value="3">≤ 3 sao (đánh giá kém)</option>
            <option value="2">≤ 2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </Field>
      </div>
      <ErrorBox error={r.error} />
      {r.loading ? <Loading /> : (
        <Card>
          <Table
            headers={['Đơn', 'Khách hàng', 'KTV', 'Đánh giá', 'Nhận xét', 'Ngày', '']}
            rows={r.data}
            empty="Không có đánh giá nào."
            render={rv => (
              <tr key={rv.id}>
                <td><Link to={'/orders/' + rv.orderId}><b>{code(rv.orderId)}</b></Link></td>
                <td>{rv.customerName}<small>{rv.customerPhone}</small></td>
                <td>{rv.technicianName}</td>
                <td><StarRow rating={rv.rating} /></td>
                <td style={{ maxWidth: '200px' }}><span style={{ fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rv.comment || '—'}</span></td>
                <td>{date(rv.createdAt)}</td>
                <td><Link className="btn small" to={'/orders/' + rv.orderId}>Xem đơn</Link></td>
              </tr>
            )}
          />
        </Card>
      )}
      <div className="pagination">
        <button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button>
        <span>Trang {filter.page}{r.meta?.total ? ` / ${Math.ceil(r.meta.total / 15)} (${r.meta.total})` : ''}</span>
        <button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button>
      </div>
    </>
  );
}

// ── Root export: Support ──────────────────────────────────────────
export function Support() {
  const { user } = useApp();
  const [screen, setScreen] = useState('dashboard');
  const [screenProps, setScreenProps] = useState({});

  if (user.role === 'KH') return <CSKHCustomerView />;

  const navigate = (s, props = {}) => { setScreen(s); setScreenProps(props); };

  if (screen === 'tickets') return <CSKHTicketList onNavigate={navigate} />;
  if (screen === 'create-complaint' || screen === 'create-complaint-from-review')
    return <CSKHCreateComplaint onBack={() => navigate('dashboard')} prefillOrderId={screenProps.orderId} />;
  if (screen === 'create-warranty')
    return <CSKHCreateWarranty onBack={() => navigate('dashboard')} />;
  if (screen === 'reviews')
    return <CSKHReviews onBack={() => navigate('dashboard')} />;
  if (screen === 'ticket-detail')
    return (
      <>
        <CSKHDashboard onNavigate={navigate} />
        <CSKHTicketDetail id={screenProps.id} onClose={() => navigate('dashboard')} onDone={() => navigate('dashboard')} />
      </>
    );
  return <CSKHDashboard onNavigate={navigate} />;
}

// ── Khách hàng xem phiếu của mình ────────────────────────────────
function CSKHCustomerView() {
  const r = useData('/support/tickets', 15000);
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <PageHead eyebrow="HỖ TRỢ KHÁCH HÀNG" title="Yêu cầu hỗ trợ của tôi" text='Mở đơn dịch vụ và chọn "Gửi yêu cầu hỗ trợ" để tạo phiếu mới.'>
        <Link className="btn" to="/support/chat">Chat hỗ trợ</Link>
        <Link className="btn primary" to="/orders">Chọn đơn cần hỗ trợ</Link>
      </PageHead>
      <ErrorBox error={r.error} />
      {r.loading ? <Loading /> : (
        <Card>
          <Table
            headers={['Phiếu', 'Nội dung', 'Trạng thái', 'Cập nhật', '']}
            rows={r.data}
            empty="Bạn chưa có yêu cầu hỗ trợ nào."
            render={t => (
              <tr key={t.id}>
                <td><b>HT-{t.id}</b><small style={{ display: 'block' }}>{TICKET_TYPE_LABELS[t.type] || t.type}</small><Link to={'/orders/' + t.orderId}>{code(t.orderId)}</Link></td>
                <td><span style={{ fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</span></td>
                <td><Badge value={t.status} />{t.resolution && <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>{t.resolution.slice(0, 60)}...</small>}</td>
                <td>{date(t.updatedAt || t.createdAt)}</td>
                <td><button className="btn small" onClick={() => setSelectedId(t.id)}>Chi tiết</button></td>
              </tr>
            )}
          />
        </Card>
      )}
      {selectedId && (
        <CSKHTicketDetail id={selectedId} onClose={() => setSelectedId(null)} onDone={() => { setSelectedId(null); r.reload(); }} />
      )}
    </>
  );
}
export function Applications() { const { user } = useApp(), r = useData(user.role === 'ADMIN' ? '/technician-applications' : '/technician-applications/me'), a = useAction(); const [selected, setSelected] = useState(null); return <><PageHead eyebrow="ĐỘI NGŨ HOMEFIX" title={user.role === 'ADMIN' ? 'Xét duyệt hồ sơ kỹ thuật viên' : 'Đăng ký cộng tác kỹ thuật viên'} text="Hồ sơ được quản trị viên kiểm tra trước khi cấp quyền nhận việc." /><ErrorBox error={r.error || a.error} />{user.role === 'KH' && !r.data?.some(x => x.status === 'Pending') && <ApplicationWizard onDone={r.reload} />}<Card title="Hồ sơ đã gửi"><Table headers={['Người nộp', 'Chuyên môn', 'Kinh nghiệm', 'Trạng thái', '']} rows={r.data} render={h => <tr key={h.id}><td>{h.fullName || user.fullName}<small>{date(h.createdAt)}</small></td><td>{groups[h.skillGroup]}<small>{h.serviceArea}</small></td><td>{h.experience}</td><td><Badge value={h.status} /><small>{h.reason}</small></td><td>{user.role === 'ADMIN' && h.status === 'Pending' && <button className="btn small" onClick={() => setSelected(h)}>Xét duyệt</button>}</td></tr>} /></Card>{selected && <ApplicationDecision record={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); r.reload(); }} />}</>; }
function ApplicationDecision({ record, onClose, onDone }) { const a = useAction(), [decision, setDecision] = useState('Approved'), [reason, setReason] = useState(''); return <Modal title={'Xét hồ sơ ' + record.fullName} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { await api('/technician-applications/' + record.id + '/decision', { method: 'POST', body: { decision, expectedVersion: record.version, ...(reason ? { reason } : {}) } }); onDone(); }); }}><p>{record.experience}</p>{record.profileJson && <ApplicationProfile json={record.profileJson} />}{(record.frontDocumentId || record.backDocumentId) && <div className="image-grid">{record.frontDocumentId && <ProtectedImage id={record.frontDocumentId} alt="CCCD mặt trước" />}{record.backDocumentId && <ProtectedImage id={record.backDocumentId} alt="CCCD mặt sau" />}</div>}<Field label="Kết quả"><select value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Duyệt thành kỹ thuật viên</option><option value="Rejected">Từ chối</option></select></Field><Field label="Lý do"><textarea required={decision === 'Rejected'} value={reason} onChange={e => setReason(e.target.value)} /></Field><small>Chỉ duyệt khi người nộp không còn đơn khách hàng đang mở. Người được duyệt cần đăng nhập lại và nạp ví trước khi nhận việc.</small><ErrorBox error={a.error} /><div className="form-actions"><Submit busy={a.busy}>Xác nhận kết quả</Submit></div></form></Modal>; }
export function Reports() { return <ReportWorkspace finance={<FinancialReport />} />; }
function FinancialReport() { const { user } = useApp(); const [range, setRange] = useState({ from: '', to: '' }), [query, setQuery] = useState(''), [rangeError,setRangeError]=useState(null); const cashflow=useReportData('/reports/cashflow'+query), settings=useReportData(user.role==='GD'?'/reports/monitoring':null); const summary = useReportData('/reports/summary' + query), techs = useReportData('/reports/technicians'), finance = useReportData(['GD', 'KT'].includes(user.role) ? '/reports/finance' + query : null), a = useAction(); async function download() { await a.run(async () => { const blob = await api('/reports/finance.csv' + query, { blob: true }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'HomeFix_BaoCaoThu.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'Đã tải báo cáo CSV.'); } const d = summary.data; return <><PageHead eyebrow="SỐ LIỆU HOẠT ĐỘNG" title="Dòng tiền, doanh thu & lợi nhuận" text="Giá trị đơn đã thu và hoa hồng đã đối soát là hai chỉ số riêng. Chưa bao gồm chi phí vận hành." ><button className="btn" disabled={cashflow.loading||!!cashflow.error} onClick={()=>csvDownload('HomeFix_DongTien.csv',[['Từ thời điểm',new URLSearchParams(query).get('from')||'Toàn bộ'],['Đến trước thời điểm',new URLSearchParams(query).get('to')||'Hiện tại'],['Ngày','Tiền vào','Tiền ra','Chênh lệch'],...(cashflow.data||[]).map(r=>[r.day,r.incoming,r.outgoing,Number(r.incoming)-Number(r.outgoing)])])}>Xuất dòng tiền</button><button className="btn" onClick={()=>document.getElementById('finance-details')?.scrollIntoView({behavior:'smooth'})}>Xem chi tiết</button>{user.role !== 'DPV' && <button className="btn primary" disabled={a.busy||finance.loading||!!finance.error} onClick={download}><Download size={17} /> Xuất CSV</button>}</PageHead><form className="filter-bar" onSubmit={e => { e.preventDefault(); if(range.from&&range.to&&range.from>range.to){setRangeError(new Error('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.'));return;} setRangeError(null); const p = new URLSearchParams(); if (range.from) p.set('from', new Date(range.from + 'T00:00:00+07:00').toISOString()); if (range.to) { const end = new Date(new Date(range.to + 'T00:00:00+07:00').getTime()+86400000); p.set('to', end.toISOString()); } setQuery(p.size ? '?' + p : ''); }}><Field label="Từ ngày"><input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></Field><Field label="Đến hết ngày"><input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></Field><button className="btn" type="submit">Áp dụng</button><button className="btn" type="button" onClick={()=>{setRange({from:'',to:''});setQuery('');setRangeError(null);}}>Toàn bộ thời gian</button></form><ErrorBox error={rangeError || summary.error || finance.error || cashflow.error || settings.error || a.error} />{d && <><div className="stat-grid"><Stat label="Đơn được tạo trong kỳ" value={d.totalOrders} /><Stat label="Giá trị đơn đã thu" value={money(d.gmv)} icon={Wallet} /><Stat label="Hoa hồng đã đối soát" value={money(d.commissionRevenue)} icon={ShieldCheck} /><Stat label="Đánh giá trung bình" value={d.averageRating ? Number(d.averageRating).toFixed(1) + '/5' : 'Chưa có'} icon={Star} /></div><div className="two-column report-columns"><div><Card title="Dòng tiền vào / ra"><CashflowChart rows={cashflow.data}/><p className="report-note">Tiền vào: thanh toán ngân hàng đã xác minh và nạp ví được duyệt. Tiền ra: rút ví đã duyệt. Tiền mặt KTV thu và bút toán đối soát nội bộ không tính vào biểu đồ này.</p></Card>{settings.data?.showCashflow!==false&&<Card title="Chi tiết dòng tiền"><Table headers={['Ngày','Tiền vào','Tiền ra','Chênh lệch']} rows={cashflow.data} render={r=><tr key={r.day}><td>{r.day}</td><td className="text-green">{money(r.incoming)}</td><td className="text-red">{money(r.outgoing)}</td><td>{money(Number(r.incoming)-Number(r.outgoing))}</td></tr>}/></Card>}</div><aside><ReportOverview items={[["Giá trị đơn đã thu",money(d.gmv)],["Hoa hồng đã đối soát",money(d.commissionRevenue)],["Dòng tiền thuần",money((cashflow.data||[]).reduce((n,r)=>n+Number(r.incoming)-Number(r.outgoing),0))],["Lợi nhuận ròng","Chưa đủ dữ liệu"]]}/>{user.role==='GD'&&<MonitoringSettings scope="finance" settings={settings} action={a}/>}<Card title="Phạm vi báo cáo"><p>Chưa có sổ chi phí vận hành để tính chi phí tổng và lợi nhuận ròng. Phần tiền thuộc KTV và vật tư được trình bày riêng bên dưới.</p>{settings.data?.financeAlerts&&(cashflow.data||[]).reduce((n,r)=>n+Number(r.incoming)-Number(r.outgoing),0)<0&&<div className="notice warning">Dòng tiền thuần trong kỳ đang âm.</div>}</Card></aside></div><FinancialBreakdown rows={finance.data} /><Card title="Giá trị thu theo ngày">{d.trend?.length ? <div className="bar-chart">{d.trend.map(item => <div className="bar-row" key={item.day}><span>{item.day}</span><div><i style={{ width: Math.max(3, Number(item.amount) / Math.max(...d.trend.map(x => Number(x.amount)), 1) * 100) + '%' }} /></div><b>{money(item.amount)}</b></div>)}</div> : <Empty title="Chưa có khoản thu trong kỳ" />}</Card></>}<Card title="Hiệu suất kỹ thuật viên (toàn bộ thời gian)"><Table headers={['Kỹ thuật viên', 'Chuyên môn', 'Đơn đã thu', 'Điểm đánh giá', 'Trạng thái']} rows={techs.data} render={t => <tr key={t.id}><td>{t.fullName}</td><td>{groups[t.skillGroup]}</td><td>{t.completedOrders}</td><td>{t.averageRating ? Number(t.averageRating).toFixed(1) : 'Chưa có'}</td><td><Badge value={t.availability} /></td></tr>} /></Card>{user.role !== 'DPV' && <div id="finance-details"><Card title="Các khoản thu trong kỳ"><Table headers={['Đơn', 'Thợ thực hiện', 'Khoản đã thu', 'Hoa hồng', 'Đối soát']} rows={finance.data} render={f => <tr key={f.id}><td>{code(f.orderId)}<small>{date(f.paidAt)}</small></td><td>{f.technicianName}</td><td>{money(f.amount)}<small>{f.method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'}</small></td><td>{money(f.commissionAmount)}</td><td><Badge value={f.settlementStatus} /></td></tr>} /></Card></div>}</>; }

function ApplicationProfile({ json }) { let profile; try { profile = JSON.parse(json); } catch { return null; } return <dl><dt>Kinh nghiệm</dt><dd>{profile.years} năm</dd><dt>Thiết bị</dt><dd>{profile.equipment}</dd><dt>Chứng chỉ</dt><dd>{profile.certificates || "Không có"}</dd><dt>Phương tiện</dt><dd>{profile.vehicle}</dd></dl>; }

function FinancialBreakdown({ rows }) {
 if (!rows) return null;
 const sum = (key, predicate = () => true) => rows.filter(predicate).reduce((total, row) => total + Number(row[key] || 0), 0);
 const collected=sum('amount'),commission=sum('commissionAmount'),materials=sum('materialTotal');
 return <div className="two-column"><Card title="Dòng tiền đã thu trong kỳ"><div className="money-lines"><div><span>Khách thanh toán tiền mặt</span><b>{money(sum('amount',r=>r.method==='COD'))}</b></div><div><span>Khách chuyển khoản về HomeFix</span><b>{money(sum('amount',r=>r.method==='BANK'))}</b></div><div className="total"><span>Tổng giá trị đơn đã thu</span><strong>{money(collected)}</strong></div></div><p>{rows.length} giao dịch thanh toán trong kỳ.</p></Card><Card title="Phân bổ doanh thu & chi phí dịch vụ"><div className="money-lines"><div><span>Vật tư đã thống nhất với khách</span><b>{money(materials)}</b></div><div><span>Phí kiểm tra & tiền công</span><b>{money(sum('inspectionFee')+sum('laborFee'))}</b></div><div><span>Hoa hồng của HomeFix</span><b>{money(commission)}</b></div><div><span>Trong đó đã đối soát</span><b>{money(sum('commissionAmount',r=>r.settlementStatus==='Confirmed'))}</b></div><div className="total"><span>Phần thuộc KTV, gồm hoàn chi vật tư</span><strong>{money(collected-commission)}</strong></div></div><small>Chưa tính lợi nhuận ròng vì hệ thống chưa ghi nhận chi phí vận hành. Hoa hồng là khoản thu của HomeFix; không đồng nhất với toàn bộ tiền khách trả.</small></Card></div>;
}

/* ============================
   BẢNG ĐIỀU PHỐI – DPV
   ============================ */
function QuickAssignModal({ order, onClose, onDone }) {
  const techs = useData('/technicians/available?orderId=' + order.id);
  const a = useAction();
  const [selected, setSelected] = useState(null);
  const assign = () => a.run(async () => {
    await api('/orders/' + order.id + '/assignments', { method: 'POST', body: { technicianId: selected, expectedVersion: order.version } });
    onDone();
  }, 'Đã gửi lệnh nhận việc thành công.');
  return (
    <Modal title={'Phân công nhanh · ' + code(order.id)} onClose={onClose}>
      <p style={{ color: '#5f6368', marginBottom: '8px' }}><b>{order.serviceName}</b> — {order.address}</p>
      <ErrorBox error={techs.error || a.error} />
      {techs.loading ? <Loading /> : !techs.data?.length
        ? <Empty title="Không có kỹ thuật viên phù hợp" text="Không có KTV sẵn sàng đúng chuyên môn và khu vực cho đơn này." />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {techs.data.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1px solid ' + (selected === t.id ? '#116a4e' : '#e0e0e0'), borderRadius: '8px', cursor: 'pointer', background: selected === t.id ? '#f0faf5' : '#fff', transition: 'all .15s' }}>
                <input type="radio" name="tech" value={t.id} checked={selected === t.id} onChange={() => setSelected(t.id)} style={{ accentColor: '#116a4e' }} />
                <div style={{ flex: 1 }}>
                  <b style={{ display: 'block' }}>{t.fullName}</b>
                  <small style={{ color: '#5f6368' }}>{groups[t.skillGroup]} · {t.serviceArea}</small>
                </div>
                <span className="badge green">Sẵn sàng</span>
              </label>
            ))}
          </div>
      }
      <div className="form-actions">
        <button className="btn" type="button" onClick={onClose}>Hủy</button>
        <Submit busy={a.busy} disabled={!selected} onClick={assign}>Giao việc</Submit>
      </div>
    </Modal>
  );
}

function AssignmentHistoryTab() {
  const [filter, setFilter] = useState({ status: '', page: 1 });
  const q = new URLSearchParams();
  if (filter.status) q.set('status', filter.status);
  q.set('page', filter.page); q.set('pageSize', 15);
  const r = useData('/assignments/history?' + q.toString());
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  return <>
    <div className="filter-bar" style={{ marginBottom: '12px' }}>
      <Field label="Trạng thái lệnh">
        <select value={filter.status} onChange={e => set('status', e.target.value)}>
          <option value="">Tất cả</option>
          <option value="Accepted">Đã nhận</option>
          <option value="Rejected">Từ chối</option>
          <option value="Expired">Hết hạn</option>
          <option value="Pending">Đang chờ</option>
        </select>
      </Field>
    </div>
    <ErrorBox error={r.error} />
    {r.loading ? <Loading /> : <Card>
      <Table
        headers={['Lệnh', 'Đơn dịch vụ', 'Kỹ thuật viên', 'Thời điểm giao', 'Hết hạn lúc', 'Kết quả']}
        rows={r.data}
        render={a => <tr key={a.id}>
          <td><b style={{ color: '#116a4e' }}>LDP-{String(a.id).padStart(4, '0')}</b></td>
          <td><Link className="text-link" to={'/orders/' + a.orderId}>{code(a.orderId)}</Link></td>
          <td>{a.technicianName || '—'}</td>
          <td>{date(a.createdAt)}</td>
          <td>{date(a.expiresAt)}</td>
          <td><Badge value={a.status} />{a.reason && <small style={{ display: 'block', color: '#d93025' }}>{a.reason}</small>}</td>
        </tr>}
      />
    </Card>}
    <div className="pagination">
      <button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button>
      <span>Trang {filter.page}</span>
      <button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button>
    </div>
  </>;
}

export function DispatchBoard() {
  const [tab, setTab] = useState('board');
  const pendingOrders = useData('/orders?status=ChoPhanCong&pageSize=50', 15000);
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=50', 15000);
  const allTechs = useData('/technicians', 15000);
  const [assignTarget, setAssignTarget] = useState(null);

  const reload = () => { pendingOrders.reload(); waitingOrders.reload(); allTechs.reload(); };

  const ready = allTechs.data?.filter(t => t.availability === 'SanSang') || [];
  const busy = allTechs.data?.filter(t => t.availability === 'DangBan') || [];
  const off = allTechs.data?.filter(t => t.availability === 'TamBan') || [];

  return <>
    <PageHead eyebrow="ĐIỀU PHỐI VIÊN" title="Bảng điều phối HomeFix" text="Theo dõi đơn cần phân công và trạng thái kỹ thuật viên theo thời gian thực.">
      <button className="btn" onClick={reload}><RefreshCw size={16} /> Cập nhật</button>
      <Link className="btn primary" to="/orders"><Plus size={17} /> Xem tất cả đơn</Link>
    </PageHead>

    {/* KPIs nhanh */}
    <div className="stat-grid" style={{ marginBottom: '24px' }}>
      <div className="stat-card" style={{ borderLeft: '3px solid #fbbc04' }}>
        <div className="stat-label">Chờ tiếp nhận<ChartNoAxesCombined size={19} /></div>
        <strong style={{ color: '#fbbc04' }}>{waitingOrders.data?.length ?? '…'}</strong>
        <small>Cần lập báo giá sơ bộ</small>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid #d93025' }}>
        <div className="stat-label">Chờ phân công<Users size={19} /></div>
        <strong style={{ color: '#d93025' }}>{pendingOrders.data?.length ?? '…'}</strong>
        <small>Cần chỉ định KTV ngay</small>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid #116a4e' }}>
        <div className="stat-label">KTV sẵn sàng<CheckCircle2 size={19} /></div>
        <strong style={{ color: '#116a4e' }}>{ready.length}</strong>
        <small>Có thể nhận việc ngay</small>
      </div>
      <div className="stat-card" style={{ borderLeft: '3px solid #1a73e8' }}>
        <div className="stat-label">KTV đang làm việc<UserCircle size={19} /></div>
        <strong style={{ color: '#1a73e8' }}>{busy.length}</strong>
        <small>{off.length} người tạm nghỉ</small>
      </div>
    </div>

    <div className="tabs" style={{ marginBottom: '20px' }}>
      <button className={tab === 'board' ? 'active' : ''} onClick={() => setTab('board')}>
        Bảng điều phối
        {(pendingOrders.data?.length || 0) > 0 && <AttentionDot show />}
      </button>
      <button className={tab === 'techs' ? 'active' : ''} onClick={() => setTab('techs')}>Danh sách KTV</button>
      <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử lệnh</button>
    </div>

    {tab === 'board' && <>
      {/* Đơn chờ phân công */}
      <Card title={`Đơn chờ phân công (${pendingOrders.data?.length ?? 0})`}>
        <ErrorBox error={pendingOrders.error} />
        {pendingOrders.loading ? <Loading /> :
          <Table
            headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Địa chỉ', 'Lịch hẹn', 'Thao tác']}
            rows={pendingOrders.data}
            empty="Không có đơn nào đang chờ phân công."
            render={o => <tr key={o.id}>
              <td><b style={{ color: '#116a4e' }}>{code(o.id)}</b></td>
              <td>{o.serviceName}<small>{groups[o.serviceGroup]}</small></td>
              <td>{o.contactName}<small>{o.contactPhone}</small></td>
              <td><small>{o.address}</small></td>
              <td>{date(o.scheduledAt)}</td>
              <td>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn small primary" onClick={() => setAssignTarget(o)}>
                    <AttentionDot /> Phân công nhanh
                  </button>
                  <Link className="btn small" to={'/orders/' + o.id}>Chi tiết</Link>
                </div>
              </td>
            </tr>}
          />
        }
      </Card>

      {/* Đơn chờ tiếp nhận */}
      <Card title={`Đơn chờ tiếp nhận (${waitingOrders.data?.length ?? 0})`} style={{ marginTop: '16px' }}>
        <ErrorBox error={waitingOrders.error} />
        {waitingOrders.loading ? <Loading /> :
          <Table
            headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Địa chỉ', 'Ngày tạo', 'Thao tác']}
            rows={waitingOrders.data}
            empty="Không có đơn nào đang chờ tiếp nhận."
            render={o => <tr key={o.id}>
              <td><b>{code(o.id)}</b></td>
              <td>{o.serviceName}<small>{groups[o.serviceGroup]}</small></td>
              <td>{o.contactName}<small>{o.contactPhone}</small></td>
              <td><small>{o.address}</small></td>
              <td>{date(o.createdAt)}</td>
              <td><Link className="btn small primary" to={'/orders/' + o.id}><AttentionDot /> Lập báo giá</Link></td>
            </tr>}
          />
        }
      </Card>
    </>}

    {tab === 'techs' && <Card title="Danh sách kỹ thuật viên">
      <ErrorBox error={allTechs.error} />
      {allTechs.loading ? <Loading /> : <>
        {Object.entries(groups).map(([gk, gname]) => {
          const list = (allTechs.data || []).filter(t => t.skillGroup === gk);
          if (!list.length) return null;
          return <div key={gk} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {gname}
              <span style={{ fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                — {list.filter(t => t.availability === 'SanSang').length} sẵn sàng / {list.length}
              </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {list.map(t => (
                <div key={t.id} style={{ padding: '12px 14px', border: '1px solid ' + (t.availability === 'SanSang' ? '#c8e6c9' : t.availability === 'DangBan' ? '#bbdefb' : '#eee'), borderRadius: '8px', background: t.availability === 'SanSang' ? '#f1fdf4' : t.availability === 'DangBan' ? '#e8f4fd' : '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <b style={{ fontSize: '14px' }}>{t.fullName}</b>
                    <Badge value={t.availability} />
                  </div>
                  <small style={{ color: '#5f6368' }}>{t.serviceArea || 'TP.HCM'}</small>
                </div>
              ))}
            </div>
          </div>;
        })}
      </>}
    </Card>}

    {tab === 'history' && <AssignmentHistoryTab />}

    {assignTarget && (
      <QuickAssignModal
        order={assignTarget}
        onClose={() => setAssignTarget(null)}
        onDone={() => { setAssignTarget(null); reload(); }}
      />
    )}
  </>;
}
