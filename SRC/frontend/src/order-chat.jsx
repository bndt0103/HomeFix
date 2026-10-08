import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { api } from './api';
import { Card, Field, ErrorBox, Submit, useData, useAction, useApp, date } from './shared';
import './order-chat.css';

export function ChatBubble({message}) {
    const {user} = useApp();
    const system = message.authorRole === 'HeThong';
    const own = message.authorId != null && String(message.authorId) === String(user.id);
    return <article className={'chat-bubble ' + (system ? 'system' : own ? 'mine' : 'received')} data-message-id={message.id}>
        {!system && <b>{message.authorName}</b>}
        <p>{message.text}</p><small>{date(message.createdAt)}</small>
    </article>;
}

export function useChatScroll(messages, orderId) {
    const {user} = useApp(), viewport = useRef(null), pinned = useRef(true), previousOrder = useRef(null);
    const latest = messages?.at(-1);
    useLayoutEffect(() => {
        const box = viewport.current;
        if (!box) return;
        if (previousOrder.current !== orderId) {pinned.current = true; previousOrder.current = orderId;}
        if (pinned.current || latest?.authorId === user.id) {pinned.current = true; box.scrollTop = box.scrollHeight;}
    }, [orderId, latest?.id, user.id]);
    useEffect(() => {
        const box = viewport.current;
        if (!box || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {if (pinned.current) box.scrollTop = box.scrollHeight;});
        observer.observe(box);
        return () => observer.disconnect();
    }, [orderId]);
    return {ref:viewport, onScroll:event => {
        const box = event.currentTarget;
        pinned.current = box.scrollHeight - box.scrollTop - box.clientHeight < 64;
    }};
}

export function useChatRead(data, orderId) {
    const lastRead = useRef(null);
    const currentMessages = (data || []).filter(message => String(message.orderId) === String(orderId));
    useEffect(() => {
        const latest = currentMessages.at(-1);
        if (!latest || document.visibilityState !== 'visible') return;
        const key = `${orderId}:${latest.id}`;
        if (lastRead.current === key) return;
        lastRead.current = key;
        api(`/orders/${orderId}/chat/read`, { method: 'POST', body: { throughId: latest.id } }).catch(() => { if (lastRead.current === key) lastRead.current = null; });
    }, [data, orderId]);
    return currentMessages;
}
export function OrderChat({ orderId }) {
    const { user } = useApp(), dispatcher = user.role === 'DPV';
    const messages = useData(`/orders/${orderId}/chat`, 3000);
    const action = useAction();
    const [text, setText] = useState('');
    const currentMessages = useChatRead(messages.data, orderId);
    const scroll = useChatScroll(currentMessages, orderId);
    return <Card className="order-chat" title={dispatcher ? 'Trao đổi với khách hàng' : 'Trao đổi với điều phối viên'}>
        <ErrorBox error={messages.error || action.error} />
        <div className="notes chat-viewport chat-messages" {...scroll} role="log" aria-label="Tin nhắn trao đổi" tabIndex={0} aria-live="polite">{!currentMessages.length && <p>Chưa có tin nhắn. Bạn có thể bắt đầu trao đổi tại đây.</p>}{currentMessages.map(message => <ChatBubble key={message.id} message={message}/>)}</div>
        <form onSubmit={event => {
            event.preventDefault();
            action.run(async () => {
                await api(`/orders/${orderId}/chat`, { method: 'POST', body: { text: text.trim() } });
                setText(''); messages.reload();
            });
        }}>
            <Field label={dispatcher ? 'Tin nhắn cho khách hàng' : 'Tin nhắn cho điều phối viên'}><textarea required maxLength={2000} value={text} onChange={event => setText(event.target.value)} /></Field>
            <Submit busy={action.busy}>Gửi tin nhắn</Submit>
        </form>
    </Card>;
}
