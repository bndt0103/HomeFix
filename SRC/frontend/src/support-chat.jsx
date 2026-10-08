import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, uuid } from './api';
import {
  Card,
  PageHead,
  Field,
  Submit,
  ErrorBox,
  Loading,
  Empty,
  useApp,
  useData,
  useAction,
  date,
} from './shared';
import { ChatBubble, useChatScroll } from './order-chat';
import './support-chat.css';

function Conversation({ conversation, reload, compact = false }) {
  const { user } = useApp(),
    customer = user.role === 'KH',
    cid = conversation.id;
  const latest = useData(`/support-chat/${cid}/messages`, 3000),
    action = useAction();
  const [text, setText] = useState(''),
    [older, setOlder] = useState([]),
    [olderCursor, setOlderCursor] = useState(undefined);
  const lastRead = useRef(null),
    preserve = useRef(null);
  const messages = useMemo(
    () =>
      [...new Map([...older, ...(latest.data || [])].map((m) => [m.id, m])).values()].sort(
        (a, b) => a.id - b.id,
      ),
    [older, latest.data],
  );
  const scroll = useChatScroll(messages, cid),
    manual = conversation.mode === 'NhanVien',
    canReply = manual && (customer || conversation.staffId === user.id);
  useEffect(() => {
    const newest = latest.data?.at(-1);
    if (!newest || lastRead.current === newest.id || document.visibilityState !== 'visible') return;
    lastRead.current = newest.id;
    api(`/support-chat/${cid}/read`, { method: 'POST', body: { throughId: newest.id } }).catch(
      () => {
        if (lastRead.current === newest.id) lastRead.current = null;
      },
    );
  }, [latest.data, cid]);
  useLayoutEffect(() => {
    if (!preserve.current || !scroll.ref.current) return;
    const box = scroll.ref.current;
    box.scrollTop = preserve.current.top + box.scrollHeight - preserve.current.height;
    preserve.current = null;
  }, [older]);
  const cursor = olderCursor === undefined ? latest.meta?.nextCursor : olderCursor;
  async function loadOlder() {
    await action.run(async () => {
      const result = await api(`/support-chat/${cid}/messages?before=${cursor}`),
        box = scroll.ref.current;
      preserve.current = box ? { top: box.scrollTop, height: box.scrollHeight } : null;
      setOlder((current) => [...result.data, ...current]);
      setOlderCursor(result.meta?.nextCursor || null);
    }, '');
  }
  return (
    <Card
      className={'order-chat support-conversation' + (compact ? ' compact-conversation' : '')}
      title={manual ? 'Trao đổi với nhân viên hỗ trợ' : 'Trò chuyện với trợ lý AI'}
    >
      <ErrorBox error={latest.error || action.error} />
      {cursor && (
        <button type="button" className="text-btn" disabled={action.busy} onClick={loadOlder}>
          Tải tin nhắn cũ
        </button>
      )}
      <div
        className="notes chat-viewport chat-messages"
        {...scroll}
        role="log"
        aria-label="Tin nhắn hỗ trợ"
        aria-live="polite"
        tabIndex={0}
      >
        {latest.loading ? (
          <Loading />
        ) : !messages.length ? (
          <p>Chưa có tin nhắn. Bạn có thể bắt đầu trao đổi tại đây.</p>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} />)
        )}
      </div>
      {conversation.pendingMessageId && <p role="status">Trợ lý AI đang trả lời…</p>}
      {!customer && manual && conversation.staffId !== user.id && (
        <button
          className="btn primary"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              await api(`/support-chat/${cid}/claim`, { method: 'POST', body: {} });
              reload();
            }, 'Đã tiếp nhận cuộc trò chuyện.')
          }
        >
          Tiếp nhận cuộc trò chuyện
        </button>
      )}
      {!customer && !manual && (
        <p>Khách đang chọn trò chuyện với AI. Bạn có thể trả lời khi khách chọn gặp nhân viên.</p>
      )}
      {(canReply || (customer && !manual)) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            action.run(async () => {
              await api(`/support-chat/${cid}/messages`, {
                method: 'POST',
                key: uuid(),
                body: { text: text.trim() },
              });
              setText('');
              latest.reload();
              reload();
            }, '');
          }}
        >
          <Field label={customer ? 'Tin nhắn hỗ trợ' : 'Trả lời khách hàng'}>
            <textarea
              required
              maxLength={2000}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <Submit
            busy={action.busy}
            disabled={action.busy || !!conversation.pendingMessageId || !text.trim()}
          >
            Gửi tin nhắn
          </Submit>
        </form>
      )}
    </Card>
  );
}

export function CustomerSupportChat({ compact = false }) {
  const conversation = useData('/support-chat/me', 3000),
    status = useData('/support-chat/status', 15000),
    action = useAction();
  const [consent, setConsent] = useState(false),
    [choosingAi, setChoosingAi] = useState(false);
  async function choose(mode) {
    await action.run(async () => {
      const current =
        conversation.data || (await api('/support-chat', { method: 'POST', body: {} })).data;
      if (current.mode !== mode || (mode === 'AI' && !current.aiConsent))
        await api(`/support-chat/${current.id}/mode`, {
          method: 'PATCH',
          body: { mode, ...(mode === 'AI' ? { aiConsent: consent } : {}) },
        });
      setChoosingAi(false);
      setConsent(false);
      conversation.reload();
    }, '');
  }
  return (
    <div
      className={compact ? 'customer-support-chat compact-support-chat' : 'customer-support-chat'}
    >
      {!compact && (
        <PageHead
          eyebrow="HỖ TRỢ KHÁCH HÀNG"
          title="Chat hỗ trợ"
          text="Chọn trợ lý AI hoặc nhân viên chăm sóc khách hàng."
        >
          <Link className="btn" to="/support">
            Phiếu hỗ trợ
          </Link>
        </PageHead>
      )}
      <ErrorBox error={conversation.error || status.error || action.error} />
      <Card
        className="support-mode-choice"
        title={compact ? undefined : 'Bạn muốn trò chuyện với ai?'}
      >
        <div className="actions">
          <button
            className={'btn' + (conversation.data?.mode === 'AI' ? ' primary' : '')}
            aria-pressed={conversation.data?.mode === 'AI'}
            disabled={action.busy || !status.data?.available}
            onClick={() => {
              if (conversation.data?.mode === 'AI' && conversation.data.aiConsent) choose('AI');
              else setChoosingAi(true);
            }}
          >
            Trợ lý AI
          </button>
          <button
            className={'btn' + (conversation.data?.mode !== 'AI' ? ' primary' : '')}
            aria-pressed={conversation.data?.mode === 'NhanVien'}
            disabled={action.busy}
            onClick={() => choose('NhanVien')}
          >
            Gặp nhân viên
          </button>
        </div>
        {!status.loading && !status.data?.available && (
          <p>Trợ lý AI chưa sẵn sàng. Bạn có thể chọn gặp nhân viên hỗ trợ.</p>
        )}
        {conversation.data?.mode === 'AI' && (
          <p>
            AI hỗ trợ tư vấn dịch vụ. Để xử lý đơn hàng, bảo hành hoặc khiếu nại, hãy chọn Gặp nhân
            viên.
          </p>
        )}
        {!compact && (
          <p>Trao đổi về chẩn đoán và báo giá với điều phối viên vẫn nằm trong chi tiết dịch vụ.</p>
        )}
        {choosingAi && (
          <div className="ai-chat-consent" role="group" aria-label="Lựa chọn AI">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              Cho phép gửi nội dung chat AI và danh mục dịch vụ công khai đến Google Gemini.
            </label>
            <div className="actions">
              <button
                className="btn"
                onClick={() => {
                  setChoosingAi(false);
                  setConsent(false);
                }}
              >
                Để sau
              </button>
              <button
                className="btn primary"
                disabled={!consent || action.busy}
                onClick={() => choose('AI')}
              >
                Bắt đầu chat AI
              </button>
            </div>
          </div>
        )}
      </Card>
      {conversation.loading ? (
        <Loading />
      ) : conversation.data ? (
        <Conversation
          key={conversation.data.id + ':' + conversation.data.mode}
          conversation={conversation.data}
          reload={conversation.reload}
          compact={compact}
        />
      ) : (
        <Empty title="Chọn cách trò chuyện để bắt đầu" />
      )}
    </div>
  );
}

export function StaffSupportMessages() {
  const [params, setParams] = useSearchParams(),
    [page, setPage] = useState(1);
  const raw = params.get('conversationId'),
    cid = /^[1-9]\d*$/.test(raw || '') ? raw : null;
  const list = useData('/support-chat/conversations?pageSize=20&page=' + page, 3000),
    detail = useData(cid ? '/support-chat/' + cid : null, 3000);
  const current = String(detail.data?.id) === cid ? detail.data : null;
  return (
    <>
      <PageHead
        eyebrow="CHĂM SÓC KHÁCH HÀNG"
        title="Hộp thư hỗ trợ"
        text="Tiếp nhận và trả lời khách đã chọn gặp nhân viên."
      >
        <Link className="btn" to="/support">
          Phiếu hỗ trợ
        </Link>
      </PageHead>
      <div className="two-column support-chat-layout">
        <Card title="Cuộc trò chuyện">
          <ErrorBox error={list.error} />
          {list.loading ? (
            <Loading />
          ) : list.data?.length ? (
            <div className="conversation-list">
              {list.data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={String(item.id) === cid}
                  onClick={() => setParams({ conversationId: String(item.id) })}
                >
                  <b>{item.customerName}</b>
                  <span className="badge">
                    {item.mode === 'AI'
                      ? 'Đang chat AI'
                      : item.staffId
                        ? 'Đang hỗ trợ'
                        : 'Chờ nhân viên'}
                  </span>
                  {Number(item.unreadCount) > 0 && (
                    <span className="badge-count">{item.unreadCount} tin chưa đọc</span>
                  )}
                  <p>{item.lastMessage || 'Khách chưa gửi tin nhắn.'}</p>
                  <small>{date(item.lastMessageAt)}</small>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="Chưa có cuộc trò chuyện" />
          )}
          <div className="pagination">
            <button
              className="btn"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trang trước
            </button>
            <span>Trang {page}</span>
            <button
              className="btn"
              disabled={!list.meta || page * 20 >= list.meta.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Trang sau
            </button>
          </div>
        </Card>
        <div className="support-chat-detail">
          {!cid ? (
            <Empty title="Chọn cuộc trò chuyện để trả lời" />
          ) : detail.error ? (
            <ErrorBox error={detail.error} />
          ) : !current ? (
            <Loading />
          ) : (
            <>
              <Card title={current.customerName}>
                <p>
                  {current.staffName
                    ? 'Nhân viên hỗ trợ: ' + current.staffName
                    : 'Chưa có nhân viên tiếp nhận.'}
                </p>
              </Card>
              <Conversation
                key={current.id + ':' + current.mode}
                conversation={current}
                reload={() => {
                  detail.reload();
                  list.reload();
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
