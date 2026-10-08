import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OrderChat } from './order-chat';
import { useData, Card, ErrorBox, Loading, Empty, Badge, code, date } from './shared';
import './dispatch-inbox.css';

export function DispatcherInbox() {
  const [params, setParams] = useSearchParams(),
    [page, setPage] = useState(1);
  const rawId = params.get('orderId'),
    orderId = /^[1-9]\d*$/.test(rawId || '') ? rawId : null;
  const list = useData('/dispatch/conversations?pageSize=20&page=' + page, 3000);
  const detail = useData(orderId ? '/orders/' + orderId : null, 10000);
  const current = String(detail.data?.id) === orderId ? detail.data : null;
  return (
    <div className="two-column dispatch-inbox">
      <Card title="Tin nhắn khách hàng">
        <p>Trao đổi theo từng dịch vụ, cả trước và sau khi gửi báo giá.</p>
        <ErrorBox error={list.error} />
        {list.loading ? (
          <Loading />
        ) : list.data?.length ? (
          <div className="conversation-list">
            {list.data.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-label={`Mở trao đổi ${code(item.id)}`}
                aria-pressed={String(item.id) === orderId}
                onClick={() => setParams({ orderId: String(item.id) })}
              >
                <div className="row space">
                  <b>
                    {code(item.id)} · {item.contactName}
                  </b>
                  {Number(item.unreadCount) > 0 && (
                    <span className="badge-count" aria-label={`${item.unreadCount} tin chưa đọc`}>
                      {item.unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.serviceName}</span>
                <p>{item.lastMessage}</p>
                <small>{date(item.lastMessageAt)}</small>
                <Badge value={item.status} />
              </button>
            ))}
          </div>
        ) : (
          <Empty title="Chưa có cuộc trao đổi" text="Tin nhắn của khách sẽ xuất hiện tại đây." />
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
            disabled={page * 20 >= Number(list.meta?.total || 0)}
            onClick={() => setPage((value) => value + 1)}
          >
            Trang sau
          </button>
        </div>
      </Card>
      <section className="conversation-detail">
        {!orderId ? (
          <Card>
            <Empty
              title="Chọn cuộc trao đổi"
              text="Chọn khách hàng bên cạnh để xem lịch sử và trả lời."
            />
          </Card>
        ) : detail.error ? (
          <ErrorBox error={detail.error} />
        ) : !current ? (
          <Loading />
        ) : (
          <>
            <Card title={`${code(current.id)} · ${current.serviceName}`}>
              <p>
                {current.contactName} · {current.contactPhone}
              </p>
              <Badge value={current.status} />
              <div className="actions">
                <Link className="btn" to={'/orders/' + current.id}>
                  Xem công việc và báo giá
                </Link>
              </div>
            </Card>
            <OrderChat key={current.id} orderId={current.id} />
          </>
        )}
      </section>
    </div>
  );
}
