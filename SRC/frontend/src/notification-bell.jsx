import React, {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Bell, X} from 'lucide-react';
import {api} from './api';
import {date, useApp, useData} from './shared';
import {AttentionDot, pendingActions, useAttention} from './attention';
import './notification-bell.css';

export function notificationPath(notification, role) {
    if(role==='KH' && notification.DuongDan==='/support/chat') return notification.DuongDan;
    if(role==='CSKH' && /^\/support\/messages\?conversationId=[1-9]\d*$/.test(notification.DuongDan||'')) return notification.DuongDan;
    if (role === 'DPV' && notification.title === 'Khách hàng nhắn tin') return '/dispatch/messages?orderId=' + notification.orderId;
    if (role === 'GD') {
        if (/tài chính|dòng tiền/i.test(notification.title)) return '/reports';
        if (/hiệu suất/i.test(notification.title)) return '/reports?tab=technicians';
        return '/reports?tab=quality';
    }
    if (role === 'KT' && notification.title === 'Yêu cầu ví chờ duyệt') return '/finance?tab=wallet';
    if (role === 'KT' && notification.title === 'Đơn COD chờ đối soát') return '/finance?tab=settlements';
    if (role === 'KT' && notification.title === 'Có chuyển khoản cần xác minh') return '/finance?tab=bank';
    if (role === 'ADMIN' && notification.title === 'Hồ sơ kỹ thuật viên chờ duyệt') return '/applications';
    if (role === 'KTV' && !notification.orderId) return '/wallet';
    return notification.orderId ? '/orders/' + notification.orderId : null;
}

function NotificationList({role, actions, onClose}) {
    const result = useData('/notifications', 10000);
    const [error, setError] = useState(null), [busy, setBusy] = useState(null);
    async function read(id) {
        setBusy(id); setError(null);
        try {await api('/notifications/' + id + '/read', {method:'PATCH', body:{}}); result.reload();}
        catch (err) {setError(err);}
        finally {setBusy(null);}
    }
    return <section className="notification-popover" aria-label="Danh sách thông báo">
        <header><strong>Thông báo</strong><button type="button" className="icon-btn" aria-label="Đóng thông báo" onClick={onClose}><X size={18}/></button></header>
        <div className="notification-popover-scroll">
            {(result.error || error) && <p role="alert">{(result.error || error).message}</p>}
            {result.error && <button type="button" className="text-btn" onClick={result.reload}>Thử tải lại</button>}
            {result.loading ? <p role="status">Đang tải thông báo…</p> : !result.error && !result.data?.length && <p className="notification-empty">Chưa có thông báo mới.</p>}
            {result.data?.slice(0, 20).map(n => {
                const path = notificationPath(n, role);
                return <article key={n.id} data-notification-id={n.id} className={'bell-notification' + (!n.readAt ? ' unread' : '')}>
                    <strong>{n.title}</strong><p>{n.body}</p><small>{date(n.createdAt)} · {n.readAt ? 'Đã đọc' : 'Chưa đọc'}</small>
                    <div className="actions">{path && <Link to={path} onClick={onClose}>Mở nội dung</Link>}{!n.readAt && <button type="button" className="text-btn" disabled={busy !== null} onClick={() => read(n.id)}>Đánh dấu đã đọc</button>}</div>
                </article>;
            })}
            {actions.length > 0 && <div className="bell-pending"><strong>Việc đang chờ xử lý</strong>{actions.map(action => <Link key={action.path} to={action.path} onClick={onClose}>{action.label}</Link>)}</div>}
        </div>
        <footer><Link to="/notifications" onClick={onClose}>Xem tất cả thông báo</Link></footer>
    </section>;
}

export function NotificationBell() {
    const {user} = useApp(), summary = useAttention(), location = useLocation();
    const actions = pendingActions(summary, user.role);
    const [open, setOpen] = useState(false), container = useRef(null), trigger = useRef(null);
    useEffect(() => setOpen(false), [location.pathname, location.search]);
    useEffect(() => {
        if (!open) return;
        container.current.querySelector('[aria-label="Đóng thông báo"]')?.focus();
        const outside = event => {if (!container.current?.contains(event.target)) setOpen(false);};
        const escape = event => {if (event.key === 'Escape') {setOpen(false); trigger.current?.focus();}};
        document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
        return () => {document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape);};
    }, [open]);
    return <div className="notification-container" ref={container}>
        <button type="button" ref={trigger} className="icon-btn notification-bell" aria-label="Thông báo" aria-expanded={open} title={`${summary.unread} thông báo chưa đọc`} onClick={() => setOpen(v => !v)}>
            <Bell size={20}/><AttentionDot show={summary.unread > 0 || actions.length > 0} label="Có thông báo hoặc việc cần xử lý"/>
        </button>
        {open && <NotificationList role={user.role} actions={actions} onClose={() => {setOpen(false); trigger.current?.focus();}}/>}
    </div>;
}
