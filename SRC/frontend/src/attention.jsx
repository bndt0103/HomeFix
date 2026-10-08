import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';
const empty = {
  unread: 0,
  chatUnread: 0,
  orderIds: [],
  orders: [],
  support: 0,
  supportChat: 0,
  applications: 0,
  policies: 0,
  error: null,
  finance: { settlements: 0, bank: 0, wallet: 0 },
};
const AttentionContext = createContext(empty);
export const useAttention = () => useContext(AttentionContext);
export function AttentionDot({ show = true, label = 'Có việc cần xử lý' }) {
  return show ? (
    <span className="attention-dot" role="img" aria-label={label} title={label} />
  ) : null;
}
export function AttentionProvider({ user, children }) {
  const [summary, setSummary] = useState(empty);
  useEffect(() => {
    let alive = true,
      running = false,
      again = false;
    const controller = new AbortController();
    async function refresh() {
      if (running) {
        again = true;
        return;
      }
      running = true;
      try {
        const r = await api('/attention-summary', { signal: controller.signal });
        if (alive) setSummary({ ...empty, ...r.data, error: null });
      } catch (error) {
        if (alive && error.name !== 'AbortError') setSummary((current) => ({ ...current, error }));
      } finally {
        running = false;
        if (again && alive) {
          again = false;
          refresh();
        }
      }
    }
    setSummary(empty);
    refresh();
    const timer = setInterval(refresh, 10000);
    window.addEventListener('homefix:changed', refresh);
    window.addEventListener('focus', refresh);
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('homefix:changed', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [user.id, user.role]);
  return <AttentionContext.Provider value={summary}>{children}</AttentionContext.Provider>;
}
export function needsAttention(summary, path) {
  const [pathname, query = ''] = path.split('?');
  if (pathname === '/dispatch/messages') return Number(summary.chatUnread) > 0;
  if (pathname === '/orders' || pathname === '/admin/orders') return summary.orderIds.length > 0;
  if (pathname === '/support/messages') return Number(summary.supportChat) > 0;
  if (pathname === '/support') return Number(summary.support) > 0;
  if (pathname === '/' && new URLSearchParams(query).get('tab') === 'policies')
    return Number(summary.policies) > 0;
  if (pathname === '/applications') return Number(summary.applications) > 0;
  if (pathname === '/finance') {
    const tab = new URLSearchParams(query).get('tab');
    if (tab === 'bank') return Number(summary.finance.bank) > 0;
    if (tab === 'wallet') return Number(summary.finance.wallet) > 0;
    if (tab === 'revenue' || tab === 'settlements') return Number(summary.finance.settlements) > 0;
    return Object.values(summary.finance).some((n) => Number(n) > 0);
  }
  return false;
}
export const taskName = (role, status) =>
  role === 'KH'
    ? {
        ChoDuyetSoBo: 'Xem và chấp nhận báo giá sơ bộ',
        ChoNghiemThu: 'Xác nhận nghiệm thu',
        HoanThanh: 'Thanh toán đơn dịch vụ',
      }[status] || 'Xem đơn cần xử lý'
    : role === 'DPV'
      ? status === 'ChoTiepNhan'
        ? 'Lập báo giá sơ bộ'
        : 'Phân công kỹ thuật viên'
      : status === 'ChoNhan'
        ? 'Phản hồi nhận đơn'
        : 'Cập nhật công việc';
export function pendingActions(summary, role) {
  const actions = summary.orders.slice(0, 3).map((o) => ({
    path: '/orders/' + o.id,
    label: 'HF-' + String(o.id).padStart(6, '0') + ' · ' + taskName(role, o.status),
  }));
  if (summary.orderIds.length > 3 || (!summary.orders.length && summary.orderIds.length))
    actions.push({ path: '/orders', label: 'Mở danh sách đơn cần xử lý' });
  for (const [key, label] of [
    ['settlements', 'đơn chờ đối soát'],
    ['wallet', 'yêu cầu ví chờ duyệt'],
    ['bank', 'chuyển khoản chờ xác minh'],
  ])
    if (Number(summary.finance[key]) > 0)
      actions.push({ path: '/finance?tab=' + key, label: summary.finance[key] + ' ' + label });
  if (summary.supportChat > 0)
    actions.push({
      path: '/support/messages',
      label: summary.supportChat + ' cuộc trò chuyện cần trả lời',
    });
  if (summary.support > 0)
    actions.push({ path: '/support', label: summary.support + ' yêu cầu hỗ trợ' });
  if (summary.applications > 0)
    actions.push({ path: '/applications', label: summary.applications + ' hồ sơ KTV chờ duyệt' });
  if (summary.policies > 0)
    actions.push({
      path: '/?tab=policies',
      label: summary.policies + ' đề xuất chính sách chờ duyệt',
    });
  return actions;
}
export function AttentionPanel({ role }) {
  const summary = useAttention();
  const count =
    summary.orderIds.length +
    Object.values(summary.finance).reduce((n, v) => n + Number(v), 0) +
    Number(summary.support || 0) +
    Number(summary.supportChat || 0) +
    Number(summary.applications || 0) +
    Number(summary.policies || 0);
  if (summary.error)
    return (
      <div className="notice warning" role="status">
        Chưa tải được thông báo công việc. Hệ thống sẽ thử lại tự động; bạn có thể mở các mục nghiệp
        vụ để kiểm tra.
      </div>
    );
  if (!count) return null;
  return (
    <section className="attention-panel" aria-label="Công việc cần bạn xử lý">
      <div>
        <strong>
          <AttentionDot />
          Bạn có {count} việc cần xử lý
        </strong>
        <small>Cập nhật tự động; mở mục bên dưới để thực hiện.</small>
      </div>
      <div className="attention-links">
        {pendingActions(summary, role).map((action) => (
          <Link key={action.path} to={action.path}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
