import {AttentionDot,useAttention} from './attention';
import { BankAccounts, BankPaymentQueue } from './bank-admin';
import React, { useEffect, useRef, useState } from 'react'; import { Link, useParams } from 'react-router-dom'; import { Plus, Pencil, CheckCircle2, Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Download, Star, ShieldCheck, Users, ChartNoAxesCombined, Lock, ChevronRight, Search, UserCircle } from 'lucide-react';
import { api, upload, uuid } from './api'; import { useApp, useData, useAction, PageHead, Card, Field, ErrorBox, Loading, Empty, Submit, Badge, money, date, code, labels, roleNames, groups, Modal, ProtectedImage } from './shared'; import { Stat } from './pages';
function Table({ headers, rows, render, empty = 'Chưa có dữ liệu' }) { return rows?.length ? <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(render)}</tbody></table></div> : <Empty title={empty} />; }
function AdminOrders() {
  const [filter, setFilter] = useState({ status: '', serviceGroup: '', from: '', to: '', page: 1 });
  const q = new URLSearchParams();
  if (filter.status) q.set('status', filter.status);
  if (filter.serviceGroup) q.set('serviceGroup', filter.serviceGroup);
  if (filter.from) q.set('from', filter.from);
  if (filter.to) { const t = new Date(filter.to); t.setDate(t.getDate() + 1); q.set('to', t.toISOString().split('T')[0]); }
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

  if (view.type === 'detail') return <UserDetail record={view.record} onBack={() => setView({ type: 'list', record: null })} onSecurity={u => setView({ type: 'security', record: u })} />;
  if (view.type === 'security') return <UserSecurity record={view.record} onBack={() => setView({ type: 'list', record: null })} />;

  return <><PageHead eyebrow="QUẢN TRỊ HOMEFIX" title="Danh sách tài khoản hệ thống" text="Tra cứu thông tin, vai trò, trạng thái hoạt động thực tế trên HomeFix">
    <button className="btn" onClick={r.reload}><RefreshCw size={16} /> Cập nhật</button>
    <button className="btn primary" onClick={() => setView({ type: 'create', record: {} })}><Plus size={17} /> Thêm tài khoản</button>
  </PageHead>
    <div className="filter-bar">
      <Field label="Tìm kiếm"><input type="search" placeholder="Tìm họ tên, số điện thoại..." value={filter.search} onChange={e => set('search', e.target.value)} /></Field>
      <Field label="Vai trò"><select value={filter.role} onChange={e => set('role', e.target.value)}><option value="">Tất cả</option>{Object.entries(roleNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Trạng thái"><select value={filter.status} onChange={e => set('status', e.target.value)}><option value="">Tất cả</option><option value="active">Hoạt động</option><option value="inactive">Bị khóa / Chờ duyệt</option></select></Field>
    </div>
    <ErrorBox error={r.error} />
    {r.loading ? <Loading /> : <Card>
      <Table headers={['Mã ID', 'Họ và tên', 'Số điện thoại', 'Email', 'Vai trò', 'Bộ phận', 'Trạng thái', 'Thao tác']} rows={r.data} render={u => <tr key={u.id}>
        <td><b style={{ color: '#116a4e' }}>{u.role}-{String(u.id).padStart(4, '0')}</b></td>
        <td><div className="flex-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '24px', height: '24px', borderRadius: '12px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={14} color="#888" /></div> <b>{u.fullName}</b></div></td>
        <td>{u.phone}</td>
        <td>{u.email || '—'}</td>
        <td><b>{roleNames[u.role]}</b></td>
        <td><small>{getDepartment(u)}</small></td>
        <td><span className={'badge ' + (u.isActive ? 'green' : 'red')}>{u.isActive ? 'Hoạt động' : 'Bị khóa'}</span></td>
        <td>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="icon-btn small" onClick={() => setView({ type: 'detail', record: u })} title="Chi tiết tài khoản"><Pencil size={14} /></button>
            <button className="icon-btn small" onClick={() => setView({ type: 'security', record: u })} title="Khóa/Xóa tài khoản" style={{ color: '#d93025' }}><Lock size={14} /></button>
          </div>
        </td>
      </tr>} />
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
function UserDetail({ record, onBack, onSecurity }) {
  const a = useAction();
  const [form, setForm] = useState({
    fullName: record.fullName || '',
    phone: record.phone || '',
    role: record.role || 'KH',
    skillGroup: record.skillGroup || 'DienLanh',
    isActive: record.isActive ?? true
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const PERMS_DEF = [
    { key: 'xem_bao_cao', label: 'Xem báo cáo' },
    { key: 'dieu_phoi_don', label: 'Điều phối đơn' },
    { key: 'phe_duyet_vi', label: 'Phê duyệt ví' },
    { key: 'quan_ly_tk', label: 'Quản lý tài khoản' },
    { key: 'xem_tai_chinh', label: 'Xem tài chính' },
    { key: 'chinh_sua_dich_vu', label: 'Chỉnh sửa dịch vụ' },
    { key: 'xem_nhat_ky', label: 'Xem nhật ký hệ thống' },
    { key: 'cau_hinh_he_thong', label: 'Cấu hình hệ thống' }
  ];
  const defaultPerms = () => Object.fromEntries(PERMS_DEF.map(p => [p.key, ['ADMIN'].includes(record.role)]));
  const [perms, setPerms] = useState(defaultPerms);
  const togglePerm = k => setPerms(s => ({ ...s, [k]: !s[k] }));

  const MODULES = [
    { mod: 'Quản lý tài khoản', cols: ['Xem', 'Thêm', 'Sửa', 'Duyệt', 'Xóa'], vals: [1, 1, 1, 0, 0] },
    { mod: 'Đơn hàng & sửa chữa', cols: ['Xem', 'Thêm', 'Sửa', 'Duyệt', 'Xóa'], vals: [1, 1, 1, 1, 0] },
    { mod: 'Dịch vụ & bảng giá', cols: ['Xem', 'Thêm', 'Sửa', 'Duyệt', 'Xóa'], vals: [1, 0, 0, 0, 0] },
    { mod: 'Tài chính & Ví KTV', cols: ['Xem', 'Thêm', 'Sửa', 'Duyệt', 'Xóa'], vals: [1, 1, 0, 0, 0] },
    { mod: 'Cấu hình hệ thống', cols: ['Xem', 'Thêm', 'Sửa', 'Duyệt', 'Xóa'], vals: [1, 0, 0, 0, 0] }
  ];
  const [modulePerms, setModulePerms] = useState(() => Object.fromEntries(MODULES.map(m => [m.mod, m.vals.map(Boolean)])));
  const toggleModulePerm = (mod, idx) => setModulePerms(s => ({ ...s, [mod]: s[mod].map((v, i) => i === idx ? !v : v) }));

  const save = () => a.run(async () => {
    await api('/users/' + record.id, { method: 'PATCH', body: { fullName: form.fullName, isActive: form.isActive, expectedVersion: record.version } });
  }, 'Đã cập nhật tài khoản thành công.');

  const logs = useData(record.id ? '/audit-logs' : '');
  const userLogs = (logs.data || []).filter(l => l.actorId === record.id).slice(0, 5);

  const hasDeletePerm = Object.values(modulePerms).some(cols => cols[4]);

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
        <Field label="Bộ phận trực thuộc">
          <select value={form.skillGroup} onChange={e => set('skillGroup', e.target.value)}>
            <option value="DienLanh">Đội Kỹ thuật số 1</option>
            <option value="DienNuoc">Đội Kỹ thuật số 2</option>
            <option value="DienGiaDung">Đội CSKH Online</option>
            <option value="VeSinh">Đội Kế toán Tổng hợp</option>
          </select>
        </Field>
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

      <Card title="Ma trận phân quyền chi tiết theo module">
        <p style={{ color: '#5f6368', fontSize: '14px', marginBottom: '16px' }}>Nhấp trực tiếp để tích chọn hoặc bỏ chọn từng quyền cụ thể của tài khoản</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Module Hệ Thống</th><th style={{ textAlign: 'center' }}>Xem</th><th style={{ textAlign: 'center' }}>Thêm</th><th style={{ textAlign: 'center' }}>Sửa</th><th style={{ textAlign: 'center' }}>Duyệt</th><th style={{ textAlign: 'center' }}>Xóa</th></tr></thead>
            <tbody>
              {MODULES.map(m => <tr key={m.mod}>
                <td><b>{m.mod}</b></td>
                {modulePerms[m.mod].map((checked, i) => <td key={i} style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleModulePerm(m.mod, i)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#116a4e' }} />
                </td>)}
              </tr>)}
            </tbody>
          </table>
        </div>

        <b style={{ display: 'block', margin: '20px 0 12px' }}>Quyền nghiệp vụ nhanh</b>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {PERMS_DEF.map(p => <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1px solid ' + (perms[p.key] ? '#116a4e' : '#e0e0e0'), borderRadius: '8px', cursor: 'pointer', background: perms[p.key] ? '#f0faf5' : '#fff', transition: 'all .15s' }}>
            <input type="checkbox" checked={perms[p.key]} onChange={() => togglePerm(p.key)} style={{ accentColor: '#116a4e', width: '15px', height: '15px' }} />
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{p.label}</span>
          </label>)}
        </div>

        {hasDeletePerm && <div style={{ background: '#fce8e6', padding: '16px', borderRadius: '8px', marginTop: '16px', display: 'flex', gap: '12px' }}>
          <ShieldCheck size={24} color="#d93025" />
          <div>
            <b style={{ color: '#d93025', display: 'block' }}>Cảnh báo: Đang cấp quyền Xóa</b>
            <small style={{ color: '#d93025' }}>Tài khoản này đang được cấp quyền Xóa dữ liệu — đây là quyền nhạy cảm cao. Hãy chắc chắn người dùng đủ tin cậy trước khi lưu thay đổi.</small>
          </div>
        </div>}
      </Card>
    </div>
  </div>;
}
function UserSecurity({ record, onBack }) {
  return <div className="user-security-page">
    <div className="breadcrumb" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#5f6368', marginBottom: '24px' }}>
      <span onClick={onBack} style={{ cursor: 'pointer', fontWeight: '500' }}>Quản lý tài khoản</span>
      <ChevronRight size={16} />
      <b style={{ color: '#202124' }}>Quản trị rủi ro & Khóa/Xóa</b>
    </div>

    <PageHead title="Hành động rủi ro & Bảo mật tài khoản" text="Quản lý tập trung các tài khoản cần tạm dừng hoạt động hoặc thu hồi vĩnh viễn quyền truy cập" />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <Card title="Danh sách tài khoản cần rà soát đặc biệt">
        <div style={{ border: '1px solid #116a4e', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#f8fdfa', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <b>{record.fullName}</b> <small style={{ color: '#5f6368' }}>{roleNames[record.role]}</small>
            <div style={{ color: '#d93025', fontSize: '13px', margin: '4px 0' }}>Lý do: Tự ý tăng giá vật tư thay thế cho khách hàng</div>
            <small style={{ color: '#888' }}>Lần cuối: Đăng nhập 2 phút trước</small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge value="Yêu cầu rà soát" />
            <div style={{ color: '#1a73e8', fontSize: '13px', marginTop: '16px', cursor: 'pointer' }}>Đang xử lý →</div>
          </div>
        </div>
      </Card>

      <Card title={"Xử lý kỷ luật tài khoản: " + record.role + "-" + String(record.id).padStart(4, '0')}>
        <p style={{ color: '#5f6368', marginBottom: '16px', fontSize: '14px' }}>Áp dụng cho: {record.fullName}</p>

        <div style={{ display: 'flex', background: '#f1f3f4', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '6px', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Khóa tài khoản tạm thời</div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', color: '#5f6368' }}>Xóa vĩnh viễn dữ liệu</div>
        </div>

        <Field label="Lý do áp dụng biện pháp"><textarea rows={2} defaultValue="Tự ý tăng giá vật tư thay thế cho khách hàng vượt mức 40% mà không qua hệ thống kiểm duyệt." /></Field>
        <Field label="Thời hạn khóa tài khoản"><select><option>Khóa tạm thời 30 ngày</option></select></Field>
        <Field label="Chuyển giao công việc & dữ liệu">
          <select><option>Bàn giao cho KTV Lê Anh Tuấn</option></select>
        </Field>
        <small style={{ color: '#5f6368', display: 'block', marginBottom: '24px' }}>Hệ thống sẽ tự động gán lại 4 đơn bảo trì đang dở dang sang KTV nhận bàn giao.</small>

        <div style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px' }}>
          <b style={{ display: 'block', marginBottom: '12px' }}>Xác nhận OTP Quản trị để thực thi</b>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="text" defaultValue="792011" style={{ width: '120px', letterSpacing: '4px', textAlign: 'center', color: '#d93025', fontWeight: 'bold', fontSize: '18px' }} />
            <small style={{ color: '#5f6368' }}>Mã xác thực đã được gửi về email giám sát của bạn</small>
          </div>
          <button className="btn primary" style={{ background: '#d93025', width: '100%', marginTop: '16px', borderColor: '#d93025' }}>XÁC NHẬN KHÓA TÀI KHOẢN NGAY</button>
        </div>
      </Card>
    </div>
  </div>;
}
export function Management() { const { section } = useParams(); if (section === 'orders') return <AdminOrders />; if (section === 'users') return <AdminUsers />; const path = { services: '/admin/services', settings: '/settings', audit: '/audit-logs' }[section]; const r = useData(path), [edit, setEdit] = useState(null); const title = { services: 'Danh mục dịch vụ', settings: 'Cấu hình nghiệp vụ', audit: 'Nhật ký hệ thống' }[section]; return <><PageHead eyebrow="QUẢN TRỊ HOMEFIX" title={title || 'Quản trị'} text={section === 'audit' ? 'Các thao tác quan trọng được ghi lại để tra cứu.' : 'Dữ liệu được lưu trên máy chủ và áp dụng thống nhất cho web/mobile.'}>{['services'].includes(section) && <button className="btn primary" onClick={() => setEdit({})}><Plus size={17} /> Thêm dịch vụ</button>}<button className="btn" onClick={r.reload}><RefreshCw size={16} /> Cập nhật</button></PageHead><ErrorBox error={r.error} />{r.loading ? <Loading /> : <Card>{section === 'services' && <Table headers={['Dịch vụ', 'Nhóm', 'Phí kiểm tra / công', 'Hoa hồng', 'Trạng thái', '']} rows={r.data} render={s => <tr key={s.id}><td><b>{s.name}</b><small>{s.description}</small></td><td>{groups[s.groupCode]}</td><td>{money(s.inspectionFee)}<small>{money(s.laborFee)} tiền công</small></td><td>{Number(s.commissionRatePercent)}%</td><td><span className={'badge ' + (s.isActive ? 'green' : 'red')}>{s.isActive ? 'Đang cung cấp' : 'Đã ẩn'}</span></td><td><button className="btn small" onClick={() => setEdit(s)}><Pencil size={14} /> Sửa</button></td></tr>} />}{section === 'settings' && <Table headers={['Tham số', 'Giá trị', 'Thao tác']} rows={r.data} render={s => <tr key={s.key}><td><b>{s.label}</b><small>{s.key}</small></td><td>{s.key === 'signatureRequired' ? (s.value === 'true' ? 'Bắt buộc' : 'Không bắt buộc') : s.value}</td><td><button className="btn small" onClick={() => setEdit(s)}>Điều chỉnh</button></td></tr>} />}{section === 'audit' && <Table headers={['Thời gian', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'Chi tiết']} rows={r.data} render={a => <tr key={a.id}><td>{date(a.createdAt)}</td><td>{a.actorName || 'Hệ thống / trigger'}</td><td>{a.action}</td><td>{a.entity} #{a.entityId || '—'}</td><td>{a.detail || '—'}</td></tr>} />}</Card>}{section === 'settings' && <BankAccounts/>}{edit && <Editor section={section} record={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); r.reload(); }} />}</>; }
function Editor({ section, record, onClose, onDone }) {
  const a = useAction(); const [form, setForm] = useState(section === 'users' ? { fullName: record.fullName || '', phone: record.phone || '', email: record.email || '', role: record.role || 'KH', initialPassword: '', isActive: record.isActive ?? true, skillGroup: 'DienLanh', serviceArea: 'TP.HCM' } : section === 'services' ? { name: record.name || '', groupCode: record.groupCode || 'DienLanh', description: record.description || '', inspectionFee: String(record.inspectionFee || '50000'), laborFee: String(record.laborFee || '300000'), commissionRatePercent: String(record.commissionRatePercent || '15'), isActive: record.isActive ?? true } : { value: record.value }); const set = (k, v) => setForm(s => ({ ...s, [k]: v })); const input = (k, label, type = 'text', required = true) => <Field label={label}><input type={type} required={required} value={form[k]} onChange={e => set(k, e.target.value)} /></Field>;
  return <Modal title={section === 'settings' ? 'Điều chỉnh ' + record.label : (record.id ? 'Cập nhật' : 'Thêm') + ' ' + (section === 'users' ? 'tài khoản' : 'dịch vụ')} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { let path, body; if (section === 'users') { path = '/users' + (record.id ? '/' + record.id : ''); body = record.id ? { fullName: form.fullName, isActive: form.isActive, expectedVersion: record.version } : { fullName: form.fullName, phone: form.phone, email: form.email || null, role: form.role, initialPassword: form.initialPassword, ...(form.role === 'KTV' ? { technicianProfile: { skillGroup: form.skillGroup, serviceArea: form.serviceArea } } : {}) }; } else if (section === 'services') { path = '/services' + (record.id ? '/' + record.id : ''); body = { ...form, ...(record.id ? { expectedVersion: record.version } : {}) }; } else { path = '/settings/' + record.key; body = { value: form.value, expectedVersion: record.version }; } await api(path, { method: record.id || section === 'settings' ? 'PATCH' : 'POST', body }); onDone(); }); }}><ErrorBox error={a.error} />{section === 'users' && <>{input('fullName', 'Họ và tên')}{!record.id && <>{input('phone', 'Số điện thoại')}{input('email', 'Email', 'email', false)}<Field label="Vai trò"><select value={form.role} onChange={e => set('role', e.target.value)}>{Object.entries(roleNames).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>{input('initialPassword', 'Mật khẩu ban đầu (từ 8 ký tự)', 'password')}{form.role === 'KTV' && <><Field label="Chuyên môn"><select value={form.skillGroup} onChange={e => set('skillGroup', e.target.value)}>{Object.entries(groups).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>{input('serviceArea', 'Khu vực phục vụ')}</>}</>}{record.id && <><p>{record.phone} · {roleNames[record.role]}</p><label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Tài khoản được hoạt động</label><small>Khóa tài khoản sẽ thu hồi các phiên đăng nhập.</small></>}</>}{section === 'services' && <>{input('name', 'Tên dịch vụ')}<Field label="Nhóm dịch vụ"><select value={form.groupCode} onChange={e => set('groupCode', e.target.value)}>{Object.entries(groups).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field><Field label="Mô tả"><textarea required minLength={5} value={form.description} onChange={e => set('description', e.target.value)} /></Field><div className="form-grid">{input('inspectionFee', 'Phí kiểm tra (đ)', 'number')}{input('laborFee', 'Tiền công (đ)', 'number')}{input('commissionRatePercent', 'Hoa hồng trên tiền công (%)', 'number')}</div><label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Dịch vụ đang được cung cấp</label><small>Giá mới áp dụng cho báo giá lập sau khi lưu. Không sửa chi phí đã được khách duyệt.</small></>}{section === 'settings' && (record.key === 'signatureRequired' ? <Field label="Yêu cầu chữ ký"><select value={form.value} onChange={e => set('value', e.target.value)}><option value="false">Không bắt buộc</option><option value="true">Bắt buộc ảnh chữ ký KH</option></select></Field> : input('value', 'Giá trị mới', 'number'))}<div className="form-actions"><button className="btn" type="button" onClick={onClose}>Hủy</button><Submit busy={a.busy} /></div></form></Modal>;
}
export function Finance(){
 const attention=useAttention();
 const [tab,setTab]=useState('settlements'),[selected,setSelected]=useState(null);
 const r=useData(tab==='bank'?null:tab==='settlements'?'/settlements':'/wallet-requests',15000);
 return <><PageHead eyebrow="TÀI CHÍNH HOMEFIX" title="Thanh toán, đối soát & ví" text="Xác minh chuyển khoản trước khi ghi nhận thanh toán; đối soát phần tiền thuộc kỹ thuật viên theo từng phương thức."/>
 <div className="tabs"><button className={tab==='settlements'?'active':''} onClick={()=>setTab('settlements')}>Đối soát thanh toán<AttentionDot show={Number(attention.finance.settlements)>0}/></button><button className={tab==='bank'?'active':''} onClick={()=>setTab('bank')}>Chuyển khoản chờ xác minh<AttentionDot show={Number(attention.finance.bank)>0}/></button><button className={tab==='wallet'?'active':''} onClick={()=>setTab('wallet')}>Yêu cầu nạp / rút<AttentionDot show={Number(attention.finance.wallet)>0}/></button></div>
 <ErrorBox error={r.error}/>
 {tab==='bank'?<BankPaymentQueue/>:r.loading?<Loading/>:<Card>{tab==='settlements'?
 <Table headers={['Đơn dịch vụ','Kỹ thuật viên','Khoản đã thu','Hoa hồng','Trạng thái','Thao tác']} rows={r.data} render={s=><tr key={s.id}><td><Link to={'/orders/'+s.orderId}>{code(s.orderId)}</Link><small>{date(s.paidAt)}</small></td><td>{s.technicianName}</td><td>{money(s.amount)}<small>{s.method==='BANK'?'HomeFix nhận chuyển khoản':'KTV nhận tiền mặt'}</small></td><td><b>{money(s.commissionAmount)}</b><small>{Number(s.commissionRatePercent)}% tiền công</small></td><td><Badge value={s.status}/></td><td>{s.status==='Pending'&&<button className="btn small primary" onClick={()=>setSelected({type:'settlement',row:s})}><AttentionDot />Đối soát</button>}</td></tr>}/>
 :<Table headers={['Yêu cầu','Kỹ thuật viên','Số tiền','Trạng thái','Thao tác']} rows={r.data} render={w=><tr key={w.id}><td><b>{w.type==='Deposit'?'Nạp ví':'Rút tiền'}</b><small>{date(w.createdAt)}</small></td><td>{w.technicianName}<small>{w.note}</small></td><td>{money(w.amount)}</td><td><Badge value={w.status}/></td><td><button className="btn small" onClick={()=>setSelected({type:'wallet',row:w})}><AttentionDot show={w.status==='Pending'}/>{w.status==='Pending'?'Xem & xử lý':'Xem chi tiết'}</button></td></tr>}/>}</Card>}
 {selected&&<FinanceDecision {...selected} onClose={()=>setSelected(null)} onDone={()=>{setSelected(null);r.reload();}}/>}
 </>;
}
function FinanceDecision({ type, row, onClose, onDone }) { const a = useAction(), requestKey = useRef(uuid()), [decision, setDecision] = useState('Approved'), [reason, setReason] = useState(''); return <Modal title={type === 'settlement' ? 'Xác nhận đối soát thanh toán' : 'Xử lý yêu cầu ví'} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { await api(type === 'settlement' ? `/settlements/${row.id}/confirm` : `/wallet-requests/${row.id}/decision`, { method: 'POST', body: type === 'settlement' ? { expectedVersion: row.version } : { decision, expectedVersion: row.version, ...(reason ? { reason } : {}) }, key: requestKey.current }); onDone(); }); }}><p><b>{row.technicianName}</b></p><div className="confirmation-amount">{money(type === 'settlement' ? (row.method === 'BANK' ? row.technicianCredit : row.commissionAmount) : row.amount)}</div>{type === 'settlement' ? <p>{row.method === 'BANK' ? 'HomeFix đã nhận chuyển khoản. Số tiền trên là phần thuộc KTV sau hoa hồng, gồm phí kiểm tra và vật tư; hệ thống cộng vào ví đúng một lần. KTV có thể yêu cầu rút tiền sau đó.' : 'KTV đã nhận tiền mặt trực tiếp. Hệ thống chỉ trừ hoa hồng từ ví đúng một lần, không cộng tiền mặt vào ví.'}</p> : <><p>{row.note}</p><Badge value={row.status} />{row.proofId && <div className="image-grid"><ProtectedImage id={row.proofId} alt="Chứng từ yêu cầu ví" /></div>}{row.status === 'Pending' && <><Field label="Kết quả xét duyệt"><select value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Đồng ý và ghi sổ</option><option value="Rejected">Từ chối</option></select></Field><Field label="Lý do / ghi chú"><textarea required={decision === 'Rejected'} value={reason} onChange={e => setReason(e.target.value)} /></Field><small>Đây là xét duyệt thủ công. Chỉ đồng ý khi đã kiểm tra chứng từ / việc chi tiền thực tế.</small></>}</>}<ErrorBox error={a.error} /><div className="form-actions"><button className="btn" type="button" onClick={onClose}>Đóng</button>{(type === 'settlement' || row.status === 'Pending') && <Submit busy={a.busy}>Xác nhận xử lý</Submit>}</div></form></Modal>; }
export function WalletPage() { const wallet = useData('/technicians/me/wallet'), income = useData('/technicians/me/income'), requests = useData('/wallet-requests'), a = useAction(); const [type, setType] = useState(null); const refresh = () => { wallet.reload(); income.reload(); requests.reload(); }; return <><PageHead eyebrow="VÍ KỸ THUẬT VIÊN" title="Ví & thu nhập" text="Tiền chuyển khoản được cộng vào ví sau đối soát và trừ hoa hồng; tiền mặt đã nhận chỉ trừ hoa hồng."><button className="btn" onClick={refresh}><RefreshCw size={16} /> Cập nhật</button></PageHead><ErrorBox error={wallet.error || requests.error || a.error} /><section className="wallet-hero"><span>Số dư ví hiện tại</span><strong>{money(wallet.data?.balance)}</strong><div className="actions"><button className="btn white" onClick={() => setType('Deposit')}><Plus size={17} /> Nạp ví</button><button className="btn glass" onClick={() => setType('Withdrawal')}><ArrowUpFromLine size={17} /> Yêu cầu rút</button></div></section><div className="stat-grid three"><Stat label="Thu nhập trước chi phí khác" value={money(income.data?.income)} icon={Wallet} /><Stat label="Hoàn chi vật tư" value={money(income.data?.materialReimbursement)} icon={ShieldCheck} /><Stat label="Đơn đã thu tiền" value={income.data?.completedOrders || 0} /></div><Card title="Yêu cầu nạp / rút"><Table headers={['Loại yêu cầu', 'Số tiền', 'Thời gian', 'Trạng thái', '']} rows={requests.data} render={r => <tr key={r.id}><td>{r.type === 'Deposit' ? 'Nạp ví' : 'Rút tiền'}<small>{r.note}</small></td><td>{money(r.amount)}</td><td>{date(r.createdAt)}</td><td><Badge value={r.status} />{r.reason && <small>{r.reason}</small>}</td><td>{r.status === 'Pending' && <button className="btn small danger" disabled={a.busy} onClick={() => a.run(async () => { await api(`/wallet-requests/${r.id}/cancel`, { method: 'POST', body: { expectedVersion: r.version } }); refresh(); })}>Hủy yêu cầu</button>}</td></tr>} /></Card><Card title="Lịch sử sổ ví"><Table headers={['Thời gian', 'Nội dung', 'Biến động']} rows={wallet.data?.transactions} render={r => <tr key={r.id}><td>{date(r.createdAt)}</td><td>{r.note}</td><td className={Number(r.amount) < 0 ? 'text-red' : 'text-green'}><b>{Number(r.amount) > 0 ? '+' : ''}{money(r.amount)}</b></td></tr>} /></Card>{type && <WalletRequest type={type} onClose={() => setType(null)} onDone={() => { setType(null); refresh(); }} />}</>; }
function WalletRequest({ type, onClose, onDone }) { const a = useAction(), [amount, setAmount] = useState(''), [note, setNote] = useState(''), [file, setFile] = useState(null), proof = useRef(null), requestKey = useRef(uuid()); return <Modal title={type === 'Deposit' ? 'Yêu cầu nạp ví' : 'Yêu cầu rút tiền'} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { if (file && !proof.current) proof.current = (await upload(file, 'WalletProof')).id; await api('/wallet-requests', { method: 'POST', body: { type, amount, note, ...(proof.current ? { proofId: proof.current } : {}) }, key: requestKey.current }); onDone(); }); }}><div className="notice info">Yêu cầu được kế toán xét duyệt thủ công. Chưa duyệt sẽ chưa làm thay đổi số dư.</div><Field label="Số tiền (đ)"><input required min="1" max="100000000" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field label={type === 'Withdrawal' ? 'Thông tin nhận tiền / ghi chú' : 'Nội dung nạp ví'}><textarea required minLength={5} value={note} onChange={e => setNote(e.target.value)} /></Field>{type === 'Deposit' && <Field label="Ảnh chứng từ"><input required type="file" accept="image/png,image/jpeg" onChange={e => { setFile(e.target.files[0]); proof.current = null; }} /></Field>}<ErrorBox error={a.error} /><div className="form-actions"><button className="btn" type="button" onClick={onClose}>Quay lại</button><Submit busy={a.busy}>Gửi yêu cầu</Submit></div></form></Modal>; }
export function Support() { const { user } = useApp(), r = useData('/support/tickets', 15000); const [selected, setSelected] = useState(null); return <><PageHead eyebrow="CHĂM SÓC KHÁCH HÀNG" title={user.role === 'KH' ? 'Yêu cầu hỗ trợ của tôi' : 'Tiếp nhận & xử lý hỗ trợ'} text={user.role === 'KH' ? 'Mở đơn dịch vụ và chọn “Gửi yêu cầu hỗ trợ” để tạo phiếu.' : 'Kiểm tra lịch sử đơn trước khi cập nhật hướng xử lý.'}>{user.role === 'KH' && <Link className="btn primary" to="/orders">Chọn đơn cần hỗ trợ</Link>}</PageHead><ErrorBox error={r.error} />{r.loading ? <Loading /> : <Card><Table headers={['Phiếu', 'Nội dung', 'Trạng thái', 'Cập nhật', '']} rows={r.data} render={t => <tr key={t.id}><td><b>HT-{t.id}</b><small>{t.type === 'Warranty' ? 'Bảo hành' : 'Khiếu nại / hỗ trợ'}</small><Link to={'/orders/' + t.orderId}>{code(t.orderId)}</Link></td><td><b>{t.customerName}</b><small>{t.description}</small></td><td><Badge value={t.status} /></td><td>{date(t.updatedAt)}</td><td><button className="btn small" onClick={() => setSelected(t.id)}>Chi tiết</button></td></tr>} /></Card>}{selected && <Ticket id={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); r.reload(); }} />}</>; }
function Ticket({ id, onClose, onDone }) { const { user } = useApp(), r = useData('/support/tickets/' + id), a = useAction(), [status, setStatus] = useState('InProgress'), [resolution, setResolution] = useState(''); return <Modal title={'Yêu cầu HT-' + id} onClose={onClose}><ErrorBox error={r.error || a.error} />{r.data && <><p className="pre-wrap">{r.data.description}</p><Badge value={r.data.status} /><div className="timeline">{r.data.history.map(h => <div key={h.id}><span /><section><b>{labels[h.status]}</b><p>{h.note}</p><small>{h.actorName} · {date(h.createdAt)}</small></section></div>)}</div>{user.role === 'CSKH' && ['Open', 'InProgress'].includes(r.data.status) && <form onSubmit={e => { e.preventDefault(); a.run(async () => { await api('/support/tickets/' + id, { method: 'PATCH', body: { status, resolution, expectedVersion: r.data.version } }); onDone(); }); }}><Field label="Trạng thái xử lý"><select value={status} onChange={e => setStatus(e.target.value)}><option value="InProgress">Đang xử lý</option><option value="Resolved">Đã giải quyết</option><option value="Rejected">Từ chối có lý do</option></select></Field><Field label="Kết quả / hướng xử lý"><textarea required minLength={5} value={resolution} onChange={e => setResolution(e.target.value)} /></Field><Submit busy={a.busy}>Cập nhật phiếu</Submit></form>}</>}</Modal>; }
export function Applications() { const { user } = useApp(), r = useData(user.role === 'ADMIN' ? '/technician-applications' : '/technician-applications/me'), a = useAction(); const [form, setForm] = useState({ skillGroup: 'DienLanh', serviceArea: 'TP.HCM', experience: '' }), [selected, setSelected] = useState(null); return <><PageHead eyebrow="ĐỘI NGŨ HOMEFIX" title={user.role === 'ADMIN' ? 'Xét duyệt hồ sơ kỹ thuật viên' : 'Đăng ký cộng tác kỹ thuật viên'} text="Hồ sơ được quản trị viên kiểm tra trước khi cấp quyền nhận việc." /><ErrorBox error={r.error || a.error} />{user.role === 'KH' && !r.data?.some(x => x.status === 'Pending') && <Card title="Thông tin chuyên môn"><form onSubmit={e => { e.preventDefault(); a.run(async () => { await api('/technician-applications', { method: 'POST', body: form }); r.reload(); }); }}><div className="form-grid"><Field label="Chuyên môn chính"><select value={form.skillGroup} onChange={e => setForm({ ...form, skillGroup: e.target.value })}>{Object.entries(groups).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field><Field label="Khu vực phục vụ"><input required value={form.serviceArea} onChange={e => setForm({ ...form, serviceArea: e.target.value })} /></Field></div><Field label="Kinh nghiệm, chứng chỉ và phương tiện làm việc"><textarea required minLength={10} rows={4} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></Field><Submit busy={a.busy}>Gửi hồ sơ xét duyệt</Submit></form></Card>}<Card title="Hồ sơ đã gửi"><Table headers={['Người nộp', 'Chuyên môn', 'Kinh nghiệm', 'Trạng thái', '']} rows={r.data} render={h => <tr key={h.id}><td>{h.fullName || user.fullName}<small>{date(h.createdAt)}</small></td><td>{groups[h.skillGroup]}<small>{h.serviceArea}</small></td><td>{h.experience}</td><td><Badge value={h.status} /><small>{h.reason}</small></td><td>{user.role === 'ADMIN' && h.status === 'Pending' && <button className="btn small" onClick={() => setSelected(h)}>Xét duyệt</button>}</td></tr>} /></Card>{selected && <ApplicationDecision record={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); r.reload(); }} />}</>; }
function ApplicationDecision({ record, onClose, onDone }) { const a = useAction(), [decision, setDecision] = useState('Approved'), [reason, setReason] = useState(''); return <Modal title={'Xét hồ sơ ' + record.fullName} onClose={onClose}><form onSubmit={e => { e.preventDefault(); a.run(async () => { await api('/technician-applications/' + record.id + '/decision', { method: 'POST', body: { decision, expectedVersion: record.version, ...(reason ? { reason } : {}) } }); onDone(); }); }}><p>{record.experience}</p><Field label="Kết quả"><select value={decision} onChange={e => setDecision(e.target.value)}><option value="Approved">Duyệt thành kỹ thuật viên</option><option value="Rejected">Từ chối</option></select></Field><Field label="Lý do"><textarea required={decision === 'Rejected'} value={reason} onChange={e => setReason(e.target.value)} /></Field><small>Chỉ duyệt khi người nộp không còn đơn khách hàng đang mở. Người được duyệt cần đăng nhập lại và nạp ví trước khi nhận việc.</small><ErrorBox error={a.error} /><div className="form-actions"><Submit busy={a.busy}>Xác nhận kết quả</Submit></div></form></Modal>; }
export function Reports() { const { user } = useApp(); const [range, setRange] = useState({ from: '', to: '' }), [query, setQuery] = useState(''); const summary = useData('/reports/summary' + query), techs = useData('/reports/technicians'), finance = useData(['GD', 'KT'].includes(user.role) ? '/reports/finance' + query : null), a = useAction(); async function download() { await a.run(async () => { const blob = await api('/reports/finance.csv' + query, { blob: true }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'HomeFix_BaoCaoThu.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'Đã tải báo cáo CSV.'); } const d = summary.data; return <><PageHead eyebrow="SỐ LIỆU HOẠT ĐỘNG" title="Báo cáo HomeFix" text="Giá trị đơn đã thu và hoa hồng đã đối soát là hai chỉ số riêng. Chưa bao gồm chi phí vận hành." >{user.role !== 'DPV' && <button className="btn primary" onClick={download}><Download size={17} /> Xuất CSV</button>}</PageHead><form className="filter-bar" onSubmit={e => { e.preventDefault(); const p = new URLSearchParams(); if (range.from) p.set('from', new Date(range.from + 'T00:00:00').toISOString()); if (range.to) { const end = new Date(range.to + 'T00:00:00'); end.setDate(end.getDate() + 1); p.set('to', end.toISOString()); } setQuery(p.size ? '?' + p : ''); }}><Field label="Từ ngày"><input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></Field><Field label="Đến hết ngày"><input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></Field><button className="btn" type="submit">Áp dụng</button></form><ErrorBox error={summary.error || finance.error || a.error} />{d && <><div className="stat-grid"><Stat label="Đơn được tạo trong kỳ" value={d.totalOrders} /><Stat label="Giá trị đơn đã thu" value={money(d.gmv)} icon={Wallet} /><Stat label="Hoa hồng đã đối soát" value={money(d.commissionRevenue)} icon={ShieldCheck} /><Stat label="Đánh giá trung bình" value={d.averageRating ? Number(d.averageRating).toFixed(1) + '/5' : 'Chưa có'} icon={Star} /></div><Card title="Giá trị thu theo ngày">{d.trend?.length ? <div className="bar-chart">{d.trend.map(item => <div className="bar-row" key={item.day}><span>{item.day}</span><div><i style={{ width: Math.max(3, Number(item.amount) / Math.max(...d.trend.map(x => Number(x.amount)), 1) * 100) + '%' }} /></div><b>{money(item.amount)}</b></div>)}</div> : <Empty title="Chưa có khoản thu trong kỳ" />}</Card></>}<Card title="Hiệu suất kỹ thuật viên (toàn bộ thời gian)"><Table headers={['Kỹ thuật viên', 'Chuyên môn', 'Đơn đã thu', 'Điểm đánh giá', 'Trạng thái']} rows={techs.data} render={t => <tr key={t.id}><td>{t.fullName}</td><td>{groups[t.skillGroup]}</td><td>{t.completedOrders}</td><td>{t.averageRating ? Number(t.averageRating).toFixed(1) : 'Chưa có'}</td><td><Badge value={t.availability} /></td></tr>} /></Card>{user.role !== 'DPV' && <Card title="Các khoản thu trong kỳ"><Table headers={['Đơn', 'Thợ thực hiện', 'Khoản đã thu', 'Hoa hồng', 'Đối soát']} rows={finance.data} render={f => <tr key={f.id}><td>{code(f.orderId)}<small>{date(f.paidAt)}</small></td><td>{f.technicianName}</td><td>{money(f.amount)}<small>{f.method === 'BANK' ? 'Chuyển khoản' : 'Tiền mặt'}</small></td><td>{money(f.commissionAmount)}</td><td><Badge value={f.settlementStatus} /></td></tr>} /></Card>}</>; }

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

