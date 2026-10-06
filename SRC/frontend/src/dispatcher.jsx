import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  FileText,
  Users,
  Ban,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  RotateCw,
  ZoomIn,
  MessageSquare,
  Sparkles,
  ArrowRight,
  UserCheck,
  DollarSign,
  AlertCircle,
  Check,
  X,
  Maximize2
} from 'lucide-react';
import { api, uuid } from './api';
import {
  useApp,
  useData,
  useAction,
  PageHead,
  Card,
  Field,
  ErrorBox,
  Loading,
  Empty,
  Submit,
  Badge,
  money,
  date,
  code,
  labels,
  groups,
  Modal,
  ProtectedImage
} from './shared';
import { AttentionDot } from './attention';
import './dispatcher.css';

/* ==========================================================================
   2. MÀN HÌNH CHẨN ĐOÁN LỖI TỪ XA (VIDEO CALL, CHAT, MEDIA INSPECTOR)
   ========================================================================== */
export function RemoteDiagnostics() {
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=100', 15000);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const a = useAction();

  const orders = waitingOrders.data || [];
  const currentOrder = orders.find(order => String(order.id) === String(selectedOrderId));

  // Dữ liệu ảnh đính kèm của đơn
  const orderFiles = useData(currentOrder ? `/orders/${currentOrder.id}/attachments` : null);
  const faultPhotos = (orderFiles.data || []).filter(f => f.purpose === 'OrderFault');
  const [showFaultPhotos, setShowFaultPhotos] = useState(false);

  // Trạng thái Chat kỹ thuật
  const chat = useData(currentOrder ? `/orders/${currentOrder.id}/chat` : null, 3000);
  const chatAction = useAction();
  const [chatInput, setChatInput] = useState('');
  const [diagnosticCode, setDiagnosticCode] = useState('');
  const [severity, setSeverity] = useState('');
  const [diagnosisNote, setDiagnosisNote] = useState('');
  useEffect(() => {
    setChatInput('');
    setShowFaultPhotos(false);
    setDiagnosticCode('');
    setSeverity('');
    setDiagnosisNote('');
  }, [currentOrder?.id]);

  const sendChat = async (textToSend) => {
    const text = (textToSend || chatInput).trim();
    if (!text || !currentOrder) return;
    await chatAction.run(async () => {
      const result = await api(`/orders/${currentOrder.id}/chat`, { method: 'POST', body: { text } });
      if (!textToSend) setChatInput('');
      chat.setData(messages => {
        const current = messages || [];
        return current.some(message => message.id === result.data.id) ? current : [...current, result.data];
      });
    }, 'Đã gửi tin nhắn cho khách hàng.');
  };

  const saveDiagnosticNote = () => {
    if (!currentOrder) return;
    a.run(async () => {
      const diagnosis = [
        `Mã lỗi dự đoán: ${diagnosticCode.trim()}`,
        `Mức độ nghiêm trọng: ${severity}`,
        `Mô tả nguyên nhân & đề xuất: ${diagnosisNote.trim()}`
      ].join('\n');
      await api(`/orders/${currentOrder.id}/preliminary-quotes`, {
        method: 'POST',
        body: {
          diagnosis,
          expectedVersion: currentOrder.version
        }
      });
      waitingOrders.setData(orders => (orders || []).filter(order => order.id !== currentOrder.id));
      setSelectedOrderId(null);
      waitingOrders.reload();
    }, 'Đã lưu chẩn đoán và gửi báo giá cho khách duyệt.');
  };

  return (
    <>
      <div className="dpv-diagnostics-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Camera size={20} style={{ color: '#116a4e' }} />
          <div>
            <b style={{ fontSize: '15px' }}>{currentOrder ? 'Chẩn đoán từ xa' : 'Đơn chờ tiếp nhận'}</b>
            <small style={{ display: 'block', color: '#64748b' }}>
              {currentOrder
                ? 'Trao đổi với khách hàng, xem ảnh sự cố và ghi nhận kết luận chẩn đoán.'
                : 'Chọn một đơn để mở cuộc trò chuyện và phiếu chẩn đoán kỹ thuật.'}
            </small>
          </div>
        </div>
        <button className="icon-btn small" onClick={() => waitingOrders.reload()} title="Tải lại danh sách đơn">
          <RefreshCw size={15} />
        </button>
      </div>

      <ErrorBox error={waitingOrders.error} />
      {waitingOrders.loading && <Loading />}
      {!waitingOrders.loading && !currentOrder && (orders.length === 0 ? (
        <Empty title="Không có đơn chờ tiếp nhận" text="Các đơn mới cần chẩn đoán từ xa sẽ xuất hiện tại đây." />
      ) : (
        <div className="dpv-diagnostics-orders">
          {orders.map(order => (
            <button
              key={order.id}
              type="button"
              className="dpv-diagnostics-order"
              onClick={() => setSelectedOrderId(order.id)}
            >
              <div className="dpv-diagnostics-order-icon"><FileText size={20} /></div>
              <div className="dpv-diagnostics-order-info">
                <div className="dpv-diagnostics-order-title">
                  <b>{code(order.id)} · {order.serviceName}</b>
                  <Badge value={order.status} />
                </div>
                <span>{order.contactName || 'Khách hàng'} · {date(order.createdAt)}</span>
                {order.description && <small>{order.description}</small>}
                {order.address && <small>{order.address}</small>}
              </div>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      ))}

      {currentOrder && (
        <div className="dpv-diagnostics-detail">
          <button type="button" className="btn small" onClick={() => setSelectedOrderId(null)}>
            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Quay lại danh sách đơn
          </button>

          <div className="dpv-panel">
            <div className="dpv-panel-head">
              <span>Hỏi đáp & Phiếu chẩn đoán · {code(currentOrder.id)}</span>
              <MessageSquare size={16} style={{ color: '#64748b' }} />
            </div>
            <div className="dpv-chat-messages dpv-diagnostics-messages">
              {(chat.data || []).filter(message => String(message.orderId) === String(currentOrder.id)).map(message => (
                <div key={message.id} className={`dpv-chat-bubble ${message.authorRole === 'KH' ? 'customer' : 'dpv'}`}>
                  <div>{message.text}</div>
                  <small style={{ fontSize: '10px', opacity: 0.7, marginTop: 4, display: 'block', textAlign: message.authorRole === 'DPV' ? 'right' : 'left' }}>
                    {message.authorName} · {date(message.createdAt)}
                  </small>
                </div>
              ))}
              {!chat.loading && !chat.error && !chat.data?.some(message => String(message.orderId) === String(currentOrder.id)) && (
                <small style={{ color: '#64748b', padding: '12px' }}>Chưa có tin nhắn cho đơn này.</small>
              )}
              {chat.loading && <small style={{ color: '#64748b', padding: '12px' }}>Đang tải tin nhắn...</small>}
            </div>
            <ErrorBox error={chat.error || chatAction.error} />
            <div className="dpv-quick-prompts">
              <button type="button" className="dpv-prompt-chip" onClick={() => sendChat('Khách hàng vui lòng kiểm tra mã lỗi hiển thị trên remote?')}>Mã lỗi remote?</button>
              <button type="button" className="dpv-prompt-chip" onClick={() => sendChat('Đã ngắt aptomat để đảm bảo an toàn chưa ạ?')}>Ngắt aptomat?</button>
              <button type="button" className="dpv-prompt-chip" onClick={() => sendChat('Thiết bị có phát ra mùi khét hoặc tiếng kêu lạ không?')}>Mùi khét / tiếng kêu?</button>
            </div>
            <div className="dpv-diagnostics-chat-input">
              <input
                type="text"
                placeholder="Nhắn tin với khách hàng..."
                maxLength={1993}
                value={chatInput}
                onChange={event => setChatInput(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && sendChat()}
                disabled={chatAction.busy}
              />
              <button className="btn primary small" onClick={() => sendChat()} disabled={chatAction.busy || !chatInput.trim()}>
                <Send size={14} />
              </button>
            </div>
          </div>

          <div className="dpv-diagnostics-photos">
            <button
              type="button"
              className="btn"
              aria-expanded={showFaultPhotos}
              onClick={() => setShowFaultPhotos(show => !show)}
            >
              <Camera size={16} /> {showFaultPhotos ? 'Ẩn ảnh sự cố' : `Ảnh sự cố (${faultPhotos.length})`}
            </button>
            <button type="button" className="icon-btn small" onClick={() => orderFiles.reload()} title="Tải lại ảnh sự cố">
              <RefreshCw size={15} />
            </button>
          </div>
          {showFaultPhotos && (
            <div className="dpv-panel dpv-diagnostics-photo-panel">
              {orderFiles.error && <ErrorBox error={orderFiles.error} />}
              {orderFiles.loading && <Loading />}
              {!orderFiles.loading && !orderFiles.error && faultPhotos.length === 0 && (
                <Empty title="Chưa có ảnh sự cố" text="Khách hàng chưa gửi ảnh cho đơn này." />
              )}
              {faultPhotos.length > 0 && (
                <div className="dpv-diagnostics-photo-grid">
                  {faultPhotos.map((file, index) => (
                    <div key={file.id} className="dpv-diagnostics-photo">
                      <ProtectedImage id={file.id} alt={`Ảnh sự cố ${index + 1}`} />
                      {file.originalName && <small>{file.originalName}</small>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="dpv-panel dpv-diagnostics-conclusion">
            <div className="dpv-panel-head">Kết luận chẩn đoán kỹ thuật</div>
            <div className="dpv-panel-body">
              <Field label="Mã lỗi dự đoán">
                <input type="text" maxLength={200} value={diagnosticCode} onChange={event => setDiagnosticCode(event.target.value)} />
              </Field>
              <Field label="Mức độ nghiêm trọng">
                <select value={severity} onChange={event => setSeverity(event.target.value)}>
                  <option value="" disabled>Chọn mức độ nghiêm trọng</option>
                  <option value="Normal">Bình thường (sửa trong ngày)</option>
                  <option value="Medium">Cần gấp (trong vòng 2 giờ)</option>
                  <option value="Critical">Khẩn cấp (nguy cơ rò rỉ điện/cháy)</option>
                </select>
              </Field>
              <Field label="Mô tả nguyên nhân & đề xuất">
                <textarea rows={3} maxLength={1500} value={diagnosisNote} onChange={event => setDiagnosisNote(event.target.value)} style={{ resize: 'vertical' }} />
              </Field>
              <div className="dpv-diagnostics-actions">
                <button
                  className="btn small"
                  onClick={saveDiagnosticNote}
                  disabled={a.busy || !diagnosticCode.trim() || !severity || !diagnosisNote.trim()}
                >
                  {a.busy ? 'Đang lưu...' : 'Lưu vào đơn'}
                </button>
              </div>
              {a.error && <ErrorBox error={a.error} />}
            </div>
          </div>
        </div>
      )}

    </>
  );
}

/* ==========================================================================
   3. THEO DÕI BÁO GIÁ SƠ BỘ
   ========================================================================== */
export function PreliminaryQuoteManager() {
  const location = useLocation();
  const unsentOrders = useData('/orders?status=ChoTiepNhan&pageSize=100', 15000);
  const sentOrders = useData('/orders?status=ChoDuyetSoBo&pageSize=100', 15000);
  const a = useAction();
  const [activeQuoteTab, setActiveQuoteTab] = useState('unsent');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const quoteDetails = useData(selectedOrder ? `/orders/${selectedOrder.id}` : null);
  const [form, setForm] = useState({ diagnosis: '', inspectionFee: '50000', laborFee: '150000', commissionPercent: '15' });
  const orders = activeQuoteTab === 'unsent'
    ? unsentOrders.data || []
    : sentOrders.data || [];
  const list = activeQuoteTab === 'unsent' ? unsentOrders : sentOrders;
  const quote = quoteDetails.data?.currentPreliminaryQuote;
  const templates = [
    { label: 'Điện lạnh - Chảy nước & Thiếu gas', serviceGroup: 'DienLanh', text: 'Kiểm tra đường thoát nước máy lạnh, vệ sinh máng hứng, xử lý mối hở tán đồng và nạp gas bổ sung.', laborFee: '150000' },
    { label: 'Điện nước - Rò rỉ ống dẫn', serviceGroup: 'DienNuoc', text: 'Kiểm tra áp lực đường nước, thay thế đoạn ống nhiệt PPR bị nứt vỡ, quấn cao su non và thay ren nối.', laborFee: '120000' },
    { label: 'Gia dụng - Hỏng tụ & Kẹt động cơ', serviceGroup: 'DienGiaDung', text: 'Kiểm tra nguồn cấp bo mạch, thay thế tụ khởi động quạt/máy giặt, vệ sinh tra dầu bảo dưỡng.', laborFee: '180000' },
    { label: 'Vệ sinh - Bảo trì định kỳ', serviceGroup: 'VeSinh', text: 'Tháo vệ sinh lồng giặt / dàn lạnh bằng máy phun áp lực cao, khử khuẩn và chạy test tải nghiệm thu.', laborFee: '150000' }
  ];
  const handleSelectOrder = order => {
    setSelectedOrder(order);
    const template = templates.find(item => item.serviceGroup === order.serviceGroup) || templates[0];
    setForm(current => ({ ...current, diagnosis: template.text, laborFee: template.laborFee }));
  };

  useEffect(() => {
    const orderId = Number(new URLSearchParams(location.search).get('orderId'));
    if (!orderId || !unsentOrders.data) return;
    const order = unsentOrders.data.find(item => item.id === orderId);
    if (order) {
      setActiveQuoteTab('unsent');
      handleSelectOrder(order);
    }
  }, [location.search, unsentOrders.data]);

  useEffect(() => {
    if (!selectedOrder) return;
    if (activeQuoteTab === 'unsent' && unsentOrders.data && !unsentOrders.data.some(order => order.id === selectedOrder.id)) {
      setSelectedOrder(null);
    }
    if (activeQuoteTab === 'sent' && sentOrders.data && !sentOrders.data.some(order => order.id === selectedOrder.id)) {
      setSelectedOrder(null);
    }
  }, [activeQuoteTab, selectedOrder, sentOrders.data, unsentOrders.data]);

  const submitQuote = () => {
    if (!selectedOrder || activeQuoteTab !== 'unsent') return;
    a.run(async () => {
      await api(`/orders/${selectedOrder.id}/preliminary-quotes`, {
        method: 'POST',
        body: { diagnosis: form.diagnosis, expectedVersion: selectedOrder.version }
      });
      setSelectedOrder(null);
      setActiveQuoteTab('sent');
      unsentOrders.reload();
      sentOrders.reload();
    }, 'Đã gửi báo giá cho khách hàng duyệt.');
  };

  return (
    <>
      <div className="dpv-quote-manager">
        <Card title={activeQuoteTab === 'unsent' ? `Đơn chưa gửi báo giá (${orders.length})` : `Đơn đã gửi · Chờ khách duyệt (${orders.length})`}>
          <div className="dpv-quote-status-tabs" role="tablist" aria-label="Trạng thái báo giá">
            <button
              type="button"
              role="tab"
              aria-selected={activeQuoteTab === 'unsent'}
              className={activeQuoteTab === 'unsent' ? 'active' : ''}
              onClick={() => {
                setActiveQuoteTab('unsent');
                setSelectedOrder(null);
              }}
            >
              Chưa gửi <span>{unsentOrders.data?.length ?? '…'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeQuoteTab === 'sent'}
              className={activeQuoteTab === 'sent' ? 'active' : ''}
              onClick={() => {
                setActiveQuoteTab('sent');
                setSelectedOrder(null);
              }}
            >
              Đã gửi · Chờ duyệt <span>{sentOrders.data?.length ?? '…'}</span>
            </button>
          </div>

          <ErrorBox error={list.error} />
          {list.loading ? <Loading /> : !orders.length ? (
            <Empty
              title={activeQuoteTab === 'unsent' ? 'Không có đơn chưa gửi báo giá' : 'Không có báo giá đang chờ khách duyệt'}
              text={activeQuoteTab === 'unsent'
                ? 'Các đơn chờ tiếp nhận sẽ xuất hiện tại đây để điều phối viên lập và gửi báo giá.'
                : 'Các đơn đã gửi báo giá và đang chờ khách hàng xác nhận sẽ xuất hiện tại đây.'}
            />
          ) : (
            <div className="dpv-quote-order-list">
              {orders.map(o => {
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`dpv-diagnostics-order ${isSelected ? 'selected' : ''}`}
                    onClick={() => activeQuoteTab === 'unsent' ? handleSelectOrder(o) : setSelectedOrder(o)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <b style={{ color: '#116a4e' }}>{code(o.id)}</b>
                      <small style={{ color: '#64748b' }}>{date(o.createdAt)}</small>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{o.serviceName}</div>
                    <div style={{ color: '#475569', fontSize: '12.5px' }}>{o.contactName} · {o.contactPhone}</div>
                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>📍 {o.address}</small>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title={selectedOrder ? `${activeQuoteTab === 'unsent' ? 'Gửi báo giá' : 'Chi tiết báo giá'} · ${code(selectedOrder.id)}` : 'Báo giá sơ bộ'}>
          {!selectedOrder ? (
            <div className="dpv-quote-empty-detail">
              <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
              <p>{activeQuoteTab === 'unsent' ? 'Chọn đơn chờ tiếp nhận để lập và gửi báo giá.' : 'Chọn đơn đã gửi để xem chi tiết báo giá.'}</p>
            </div>
          ) : activeQuoteTab === 'unsent' ? (
            <div className="dpv-quote-detail">
              <div className="dpv-quote-order-summary">
                <b>{selectedOrder.serviceName}</b>
                <span>{selectedOrder.contactName} · {selectedOrder.contactPhone}</span>
                <span>{selectedOrder.address}</span>
                <span>Mô tả: {selectedOrder.description}</span>
              </div>
              <div>
                <b>Mẫu gợi ý chẩn đoán</b>
                <div className="dpv-template-list">
                  {templates.map(template => (
                    <button
                      key={template.label}
                      type="button"
                      className="dpv-template-btn"
                      onClick={() => setForm(current => ({ ...current, diagnosis: template.text, laborFee: template.laborFee }))}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Chẩn đoán & phương án xử lý (khách hàng sẽ xem)">
                <textarea rows={4} maxLength={1993} value={form.diagnosis} onChange={event => setForm(current => ({ ...current, diagnosis: event.target.value }))} />
              </Field>
              <div className="dpv-quote-costs">
                <div><span>Phí kiểm tra</span><b>{money(form.inspectionFee)}</b></div>
                <div><span>Tiền công</span><b>{money(form.laborFee)}</b></div>
                <div><span>Hoa hồng nền tảng ({form.commissionPercent}%)</span><b>{money(Number(form.laborFee) * Number(form.commissionPercent) / 100)}</b></div>
                <div className="total"><span>Tổng chi phí sơ bộ</span><b>{money(Number(form.inspectionFee) + Number(form.laborFee))}</b></div>
              </div>
              <ErrorBox error={a.error} />
              <div className="dpv-quote-actions">
                <Submit busy={a.busy} onClick={submitQuote} disabled={a.busy || form.diagnosis.trim().length < 5}>
                  <Send size={16} /> Gửi báo giá cho khách duyệt
                </Submit>
              </div>
            </div>
          ) : (
            quoteDetails.loading || (!quoteDetails.error && String(quoteDetails.data?.id) !== String(selectedOrder.id)) ? <Loading />
              : quoteDetails.error ? <ErrorBox error={quoteDetails.error} />
                : !quote ? <Empty title="Không tìm thấy báo giá" text="Đơn hàng này chưa có phiếu báo giá sơ bộ." />
                  : (
            <div className="dpv-quote-detail">
              <div className="dpv-quote-order-summary">
                <b>{quoteDetails.data.serviceName}</b>
                <span>{quoteDetails.data.contactName} · {date(quote.createdAt)}</span>
                <span>{quoteDetails.data.address}</span>
              </div>
              <div className="dpv-quote-status">
                <span>Trạng thái báo giá</span>
                <span className="badge amber">Đã gửi · Chờ khách duyệt</span>
              </div>
              <div>
                <b>Chẩn đoán & phương án xử lý</b>
                <p className="pre-wrap">{quote.diagnosis}</p>
              </div>
              <div className="dpv-quote-costs">
                <div><span>Phí kiểm tra</span><b>{money(quote.inspectionFee)}</b></div>
                <div><span>Tiền công</span><b>{money(quote.laborFee)}</b></div>
                <div><span>Hoa hồng nền tảng ({quote.commissionRatePercent}%)</span><b>{money(Number(quote.laborFee) * Number(quote.commissionRatePercent) / 100)}</b></div>
                <div className="total"><span>Tổng chi phí sơ bộ</span><b>{money(quote.total)}</b></div>
              </div>
              <div className="notice info">Báo giá đã được gửi. Khách hàng sẽ xem và quyết định duyệt trên đơn hàng của họ.</div>
            </div>
                  )
          )}
        </Card>
      </div>
    </>
  );
}

/* ==========================================================================
   4. MÀN HÌNH ĐIỀU PHỐI THỢ / DISPATCH (SMART DISPATCH CENTER)
   ========================================================================== */
export function SmartDispatchCenter() {
  const pendingOrders = useData('/orders?status=ChoPhanCong&pageSize=50', 15000);
  const allTechs = useData('/technicians', 15000);
  const a = useAction();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' | 'history'

  const orders = pendingOrders.data || [];
  const techs = allTechs.data || [];

  // Khi chọn một đơn hàng, lấy danh sách thợ phù hợp
  const targetOrder = selectedOrder || orders[0];
  const matchingTechs = targetOrder ? techs.filter(t => {
    // Tiêu chí 1: Đúng nhóm chuyên môn
    if (t.skillGroup !== targetOrder.serviceGroup) return false;
    return true;
  }) : [];

  const handleAssign = () => {
    if (!targetOrder || !selectedTechId) return;
    a.run(async () => {
      await api(`/orders/${targetOrder.id}/assignments`, {
        method: 'POST',
        body: {
          technicianId: selectedTechId,
          expectedVersion: targetOrder.version
        }
      });
      setSelectedTechId(null);
      pendingOrders.reload();
      allTechs.reload();
      alert(`Đã gửi lệnh điều phối đơn ${code(targetOrder.id)} cho kỹ thuật viên!`);
    }, 'Đã gửi lệnh nhận việc thành công.');
  };

  return (
    <>
      <div className="tabs" style={{ marginBottom: '18px' }}>
        <button className={activeTab === 'dispatch' ? 'active' : ''} onClick={() => setActiveTab('dispatch')}>
          Điều phối thợ thông minh ({orders.length})
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
          Lịch sử lệnh điều phối
        </button>
      </div>

      {activeTab === 'dispatch' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
          {/* Cột trái: Đơn chờ phân công */}
          <Card title={`Đơn chờ ghép thợ (${orders.length})`}>
            <ErrorBox error={pendingOrders.error} />
            {pendingOrders.loading ? <Loading /> : !orders.length ? (
              <Empty title="Không có đơn chờ phân công" text="Tất cả các đơn đã được chỉ định KTV thành công." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.map(o => {
                  const isCurrent = targetOrder?.id === o.id;
                  return (
                    <div
                      key={o.id}
                      onClick={() => { setSelectedOrder(o); setSelectedTechId(null); }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid ' + (isCurrent ? '#116a4e' : '#e2e8f0'),
                        background: isCurrent ? '#f0faf5' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <b style={{ color: '#116a4e' }}>{code(o.id)}</b>
                        <span className="badge green">Đã duyệt giá</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{o.serviceName}</div>
                      <small style={{ color: '#475569' }}>Khách: {o.contactName} ({o.contactPhone})</small>
                      <small style={{ display: 'block', color: '#64748b', marginTop: '2px' }}>📍 {o.address}</small>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cột phải: Khung ghép thợ thông minh */}
          <Card title={targetOrder ? `Ghép thợ cho đơn ${code(targetOrder.id)} · ${targetOrder.serviceName}` : 'Ghép thợ'}>
            {!targetOrder ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Users size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
                <p>Chọn một đơn hàng bên trái để thực hiện điều phối thợ.</p>
              </div>
            ) : (
              <div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b>Chuyên môn cần tìm:</b> <span className="badge green">{groups[targetOrder.serviceGroup] || targetOrder.serviceGroup}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Khu vực: <b>{targetOrder.address}</b>
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Kỹ thuật viên khả dụng theo thuật toán gợi ý:</h4>

                {!matchingTechs.length ? (
                  <Empty title="Chưa có KTV phù hợp" text="Không có thợ nào đúng chuyên môn hoặc thợ đang bận ca." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {matchingTechs.map((t, idx) => {
                      const isSelected = selectedTechId === t.id;
                      const isReady = t.availability === 'SanSang';
                      const isBestMatch = idx === 0 && isReady;

                      return (
                        <div
                          key={t.id}
                          className={`dpv-candidate-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedTechId(t.id)}
                        >
                          <input
                            type="radio"
                            name="tech_select"
                            checked={isSelected}
                            onChange={() => setSelectedTechId(t.id)}
                            style={{ accentColor: '#116a4e' }}
                          />

                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: isReady ? '#e6f4ea' : '#f1f5f9', color: isReady ? '#137333' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {t.fullName.charAt(0)}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <b style={{ fontSize: '14px' }}>{t.fullName}</b>
                              {isBestMatch && (
                                <span className="dpv-candidate-badge-best">
                                  <Sparkles size={12} /> Đề xuất tối ưu
                                </span>
                              )}
                              <Badge value={t.availability} />
                            </div>
                            <small style={{ color: '#64748b' }}>
                              Khu vực: {t.serviceArea} · Ví: <span style={{ color: '#116a4e', fontWeight: 600 }}>{money(t.balance || 1500000)}</span> · Đánh giá: {t.averageRating ? `${Number(t.averageRating).toFixed(1)} ⭐` : '5.0 ⭐'}
                            </small>
                          </div>

                          <div>
                            {isReady ? (
                              <button
                                className={`btn small ${isSelected ? 'primary' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedTechId(t.id); }}
                              >
                                {isSelected ? <Check size={14} /> : null} Chọn thợ này
                              </button>
                            ) : (
                              <small style={{ color: '#ef4444' }}>Đang bận ca</small>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <ErrorBox error={a.error} />

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Submit busy={a.busy} disabled={!selectedTechId} onClick={handleAssign}>
                    <Send size={16} /> Gửi lệnh điều phối (Thời hạn 10 phút)
                  </Submit>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Lịch sử lệnh điều phối */
        <AssignmentHistoryFullTab />
      )}
    </>
  );
}

function AssignmentHistoryFullTab() {
  const [filter, setFilter] = useState({ status: '', page: 1 });
  const q = new URLSearchParams();
  if (filter.status) q.set('status', filter.status);
  q.set('page', filter.page);
  q.set('pageSize', 15);
  const r = useData('/assignments/history?' + q.toString());
  const set = (k, v) => setFilter(s => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));

  return (
    <>
      <div className="filter-bar" style={{ marginBottom: '14px' }}>
        <Field label="Lọc trạng thái lệnh">
          <select value={filter.status} onChange={e => set('status', e.target.value)}>
            <option value="">Tất cả kết quả</option>
            <option value="Accepted">Đã nhận việc (Accepted)</option>
            <option value="Rejected">KTV từ chối (Rejected)</option>
            <option value="Expired">Hết hạn phản hồi (Expired)</option>
            <option value="Pending">Đang chờ KTV phản hồi</option>
          </select>
        </Field>
      </div>
      <ErrorBox error={r.error} />
      {r.loading ? <Loading /> : (
        <Card>
          <Table
            headers={['Mã lệnh', 'Đơn dịch vụ', 'Kỹ thuật viên', 'Thời điểm gửi', 'Thời hạn', 'Trạng thái', 'Ghi chú / Lý do']}
            rows={r.data}
            empty="Chưa có dữ liệu lịch sử lệnh điều phối."
            render={a => (
              <tr key={a.id}>
                <td><b style={{ color: '#116a4e' }}>LDP-{String(a.id).padStart(4, '0')}</b></td>
                <td><Link to={'/orders/' + a.orderId} className="text-link">{code(a.orderId)}</Link></td>
                <td><b>{a.technicianName || '—'}</b></td>
                <td>{date(a.createdAt)}</td>
                <td>{date(a.expiresAt)}</td>
                <td><Badge value={a.status} /></td>
                <td>{a.reason ? <span style={{ color: '#d93025' }}>{a.reason}</span> : '—'}</td>
              </tr>
            )}
          />
        </Card>
      )}
      <div className="pagination">
        <button className="btn" disabled={filter.page === 1} onClick={() => set('page', filter.page - 1)}>Trang trước</button>
        <span>Trang {filter.page}</span>
        <button className="btn" disabled={!r.data || r.data.length < 15} onClick={() => set('page', filter.page + 1)}>Trang sau</button>
      </div>
    </>
  );
}

/* ==========================================================================
   5. MÀN HÌNH HỦY ĐƠN HÀNG & XỬ LÝ PHÍ DI CHUYỂN
   ========================================================================== */
export function CancellationManager() {
  const cancellationRequests = useData('/orders?cancellationRequests=pending&pageSize=100', 10000);
  const cancelledOrders = useData('/orders?status=Huy&pageSize=50');
  const a = useAction();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Khách hàng đổi ý, không còn nhu cầu sửa chữa');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [cancelFee, setCancelFee] = useState('0');
  const [customFee, setCustomFee] = useState('50000');

  const REASONS = [
    'Khách hàng đổi ý, không còn nhu cầu sửa chữa',
    'Khách đã tự khắc phục được sự cố tạm thời',
    'Không liên lạc được với khách hàng qua số điện thoại',
    'Kỹ thuật viên gặp sự cố bất khả kháng trên đường di chuyển',
    'Thiết bị hỏng hóc quá nặng, khách từ chối chi phí sửa',
    'Sai lệch thông tin địa chỉ hoặc ngoài phạm vi phục vụ'
  ];

  useEffect(() => {
    if (!selectedOrder) return;
    setCustomCancelReason('');
    const defaultFee = selectedOrder.status === 'DangDiChuyen' ? String(selectedOrder.cancellationFeeSnapshot ?? 50000) : '0';
    const presetFees = ['0', '50000', '60000', '100000', '150000', '200000', '300000'];
    const normalizedFee = presetFees.includes(defaultFee) ? defaultFee : 'custom';
    setCancelFee(normalizedFee);
    setCustomFee(normalizedFee === 'custom' ? defaultFee : (defaultFee || '50000'));
  }, [selectedOrder]);

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    const selectedReason = cancelReason === 'Lý do khác' ? customCancelReason.trim() : cancelReason;
    const finalReason = customNote.trim() ? `${selectedReason} (${customNote.trim()})` : selectedReason;
    const chosenFee = cancelFee === 'custom' ? Number(customFee || 0) : Number(cancelFee || 0);

    a.run(async () => {
      await api(`/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        body: {
          reason: finalReason,
          expectedVersion: selectedOrder.version,
          fee: chosenFee
        }
      });
      setSelectedOrder(null);
      setCustomCancelReason('');
      setCustomNote('');
      setCancelFee('0');
      setCustomFee('50000');
      cancellationRequests.reload();
      cancelledOrders.reload();
      alert('Đã xử lý hủy đơn hàng thành công theo quy chuẩn!');
    }, 'Đã hủy đơn hàng thành công.');
  };

  const isEnRoute = selectedOrder?.status === 'DangDiChuyen';
  const selectedFeeValue = cancelFee === 'custom' ? Number(customFee || 0) : Number(cancelFee || 0);
  const hasSelectedFee = selectedFeeValue > 0;

  return (
    <>
      <div className="dpv-cancellation-manager">
        {/* Bảng quản lý & chọn đơn cần hủy */}
        <Card title="Yêu cầu hủy do khách gửi">
            <ErrorBox error={cancellationRequests.error} />
            {cancellationRequests.loading ? <Loading /> : (
              <Table
                headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Lý do khách hủy', 'Trạng thái hiện tại', 'KTV phụ trách', 'Thao tác']}
                rows={cancellationRequests.data || []}
                empty="Chưa có yêu cầu hủy nào do khách gửi tới."
                render={o => {
                  const isSelected = selectedOrder?.id === o.id;
                  const enRoute = o.status === 'DangDiChuyen';

                  return (
                    <tr key={o.id} style={{ background: isSelected ? '#fef2f2' : undefined }}>
                      <td><b>{code(o.id)}</b></td>
                      <td>{o.serviceName}</td>
                      <td>{o.contactName}<small>{o.contactPhone}</small></td>
                      <td><small className="pre-wrap">{o.cancelReason || 'Khách chưa ghi lý do.'}</small></td>
                      <td><Badge value={o.status} /></td>
                      <td>{o.technicianName || <small style={{ color: '#94a3b8' }}>Chưa có</small>}</td>
                      <td>
                        <button
                          className={`btn small ${enRoute ? 'danger' : ''}`}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <Ban size={14} /> Xử lý hủy
                        </button>
                      </td>
                    </tr>
                  );
                }}
              />
            )}
        </Card>

        {/* Lịch sử các đơn đã hủy */}
        <Card title="Nhật ký các đơn đã hủy & Đối soát phí di chuyển" style={{ marginTop: '20px' }}>
            <Table
              headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Thời điểm hủy', 'Phí di chuyển', 'Lý do hủy']}
              rows={cancelledOrders.data}
              empty="Chưa có đơn hàng nào bị hủy."
              render={o => (
                <tr key={o.id}>
                  <td><b>{code(o.id)}</b></td>
                  <td>{o.serviceName}</td>
                  <td>{o.contactName}</td>
                  <td>{date(o.updatedAt || o.createdAt)}</td>
                  <td>
                    {Number(o.cancellationFee) > 0 ? (
                      <span className="badge red" style={{ fontWeight: 700 }}>
                        {money(o.cancellationFee)}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>Miễn phí (0đ)</span>
                    )}
                  </td>
                  <td><small style={{ color: '#991b1b' }}>{o.cancelReason || 'Khách hủy'}</small></td>
                </tr>
              )}
            />
        </Card>
      </div>

      {/* Form xác nhận hủy và phí di chuyển */}
      {selectedOrder && <Modal
        title="Xử lý hủy đơn & Phí bồi hoàn di chuyển"
        onClose={() => setSelectedOrder(null)}
        className="dpv-cancel-modal"
      >
        <div className="dpv-cancel-dialog">
          <div className="dpv-cancel-order-summary">
            <div className="dpv-cancel-order-heading">
              <b>{code(selectedOrder.id)}</b>
              <Badge value={selectedOrder.status} />
            </div>
            <dl className="dpv-cancel-order-details">
              <div><dt>Dịch vụ</dt><dd>{selectedOrder.serviceName}</dd></div>
              <div><dt>Khách hàng</dt><dd>{selectedOrder.contactName}<small>{selectedOrder.contactPhone}</small></dd></div>
              <div><dt>Kỹ thuật viên</dt><dd>{selectedOrder.technicianName || 'Chưa gán thợ'}</dd></div>
              <div className="dpv-cancel-customer-reason"><dt>Lý do khách hủy</dt><dd className="pre-wrap">{selectedOrder.cancelReason || 'Khách chưa ghi lý do.'}</dd></div>
            </dl>
          </div>

          {/* Banner giải trình quy tắc tính phí di chuyển */}
          {hasSelectedFee ? (
            <div className="dpv-cancel-notice danger">
              <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>ÁP DỤNG PHÍ HỦY: {money(selectedFeeValue)}</b>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                  {isEnRoute
                    ? 'Kỹ thuật viên đang trên đường di chuyển đến nhà khách. Điều phối viên có thể điều chỉnh mức phí hủy phù hợp với chính sách đang áp dụng cho đơn này.'
                    : 'Đơn hàng được áp dụng phí hủy theo mức đã chọn. Khách hàng sẽ phải thanh toán khoản này nếu xác nhận hủy.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="dpv-cancel-notice warning">
              <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>HỦY MIỄN PHÍ (0đ)</b>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                  Đơn hàng chưa bắt đầu di chuyển hoặc mức phí hủy được chọn là 0đ. Khách hàng và thợ được miễn phí hủy đơn hoàn toàn.
                </p>
              </div>
            </div>
          )}

          <div className="dpv-cancel-fee-box">
            <div className="dpv-cancel-fee-total">
              <span>Phí hủy / phí di chuyển</span>
              <b className={selectedFeeValue > 0 ? 'has-fee' : ''}>{money(selectedFeeValue)}</b>
            </div>
            <div className="dpv-cancel-fee-controls">
              <Field label="Mức phí áp dụng">
                <select value={cancelFee} onChange={e => setCancelFee(e.target.value)}>
                  <option value="0">Miễn phí (0đ)</option>
                  <option value="50000">50.000đ</option>
                  <option value="60000">60.000đ</option>
                  <option value="100000">100.000đ</option>
                  <option value="150000">150.000đ</option>
                  <option value="200000">200.000đ</option>
                  <option value="300000">300.000đ</option>
                  <option value="custom">Tùy chọn khác</option>
                </select>
              </Field>
              {cancelFee === 'custom' && (
                <Field label="Nhập số tiền">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={customFee}
                    onChange={e => setCustomFee(e.target.value)}
                    placeholder="Nhập số tiền"
                  />
                </Field>
              )}
            </div>
          </div>

          <Field label="Lý do hủy tiêu chuẩn">
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
              {REASONS.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </Field>

          {cancelReason === 'Lý do khác' && (
            <Field label="Nhập lý do hủy" hint="Vui lòng nhập ít nhất 5 ký tự.">
              <textarea
                rows={3}
                required
                minLength={5}
                maxLength={1000}
                placeholder="Nhập lý do hủy..."
                value={customCancelReason}
                onChange={e => setCustomCancelReason(e.target.value)}
              />
            </Field>
          )}

          <Field label="Ghi chú bổ sung của điều phối viên">
            <textarea
              rows={3}
              placeholder="Nhập thông tin chi tiết giải trình việc hủy đơn..."
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
            />
          </Field>

          <ErrorBox error={a.error} />

          <div className="dpv-cancel-actions">
            <button type="button" className="btn" onClick={() => setSelectedOrder(null)}>Hủy bỏ</button>
            <button className="btn primary" disabled={a.busy || (cancelReason === 'Lý do khác' && customCancelReason.trim().length < 5)} onClick={handleCancelOrder}>
              <Ban size={15} /> Xác nhận hủy đơn
            </button>
          </div>
        </div>
      </Modal>}
    </>
  );
}

/* ==========================================================================
   HUB CHÍNH ĐIỀU PHỐI VIÊN (TÍCH HỢP TẤT CẢ 5 MÀN HÌNH VÀO 1 GIAO DIỆN CHUẨN)
   ========================================================================== */
function Table({ headers, rows, render, empty = 'Chưa có dữ liệu' }) {
  return rows?.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map(render)}</tbody>
      </table>
    </div>
  ) : (
    <Empty title={empty} />
  );
}

export function DispatcherHub({ initialTab = 'diagnostics' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định tab hiện tại dựa vào URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/diagnostics')) return 'diagnostics';
    if (path.includes('/quotes')) return 'quotes';
    if (path.includes('/assign')) return 'assign';
    if (path.includes('/cancellations')) return 'cancellations';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    const routes = {
      diagnostics: '/dispatch/diagnostics',
      quotes: '/dispatch/quotes',
      assign: '/dispatch/assign',
      cancellations: '/dispatch/cancellations'
    };
    navigate(routes[tabKey]);
  };

  // Lấy các chỉ số badge tức thời
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=1', 30000);
  const pendingOrders = useData('/orders?status=ChoPhanCong&pageSize=1', 30000);

  return (
    <>
      <PageHead
        eyebrow="TRUNG TÂM ĐIỀU PHỐI HOMEFIX"
        title="Bàn làm việc Điều phối viên"
        text="Theo dõi công việc, chẩn đoán lỗi từ xa, lập báo giá sơ bộ, điều phối thợ và xử lý hủy đơn, phí di chuyển."
      >
        <Link to="/orders" className="btn"><FileText size={16} /> Danh sách tất cả đơn</Link>
      </PageHead>

      {/* Thanh điều hướng các module điều phối */}
      <div className="dpv-hub-nav">
        <button
          className={`dpv-hub-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => switchTab('diagnostics')}
        >
          <Camera size={17} />
          Chẩn đoán từ xa (Ảnh & Chat)
          {(waitingOrders.data?.length || 0) > 0 && <span className="badge-count">{waitingOrders.data.length}</span>}
        </button>

        <button
          className={`dpv-hub-tab ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => switchTab('quotes')}
        >
          <FileText size={17} />
          Lập báo giá sơ bộ
        </button>

        <button
          className={`dpv-hub-tab ${activeTab === 'assign' ? 'active' : ''}`}
          onClick={() => switchTab('assign')}
        >
          <Users size={17} />
          Điều phối thợ (Dispatch)
          {(pendingOrders.data?.length || 0) > 0 && <span className="badge-count">{pendingOrders.data.length}</span>}
        </button>

        <button
          className={`dpv-hub-tab ${activeTab === 'cancellations' ? 'active' : ''}`}
          onClick={() => switchTab('cancellations')}
        >
          <Ban size={17} />
          Hủy đơn & Phí di chuyển
        </button>
      </div>

      {/* Render màn hình tương ứng */}
      {activeTab === 'diagnostics' && <RemoteDiagnostics />}
      {activeTab === 'quotes' && <PreliminaryQuoteManager />}
      {activeTab === 'assign' && <SmartDispatchCenter />}
      {activeTab === 'cancellations' && <CancellationManager />}
    </>
  );
}
