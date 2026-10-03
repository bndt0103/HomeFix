import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Video,
  FileText,
  Users,
  Ban,
  Phone,
  PhoneOff,
  VideoOff,
  Mic,
  MicOff,
  Camera,
  Share2,
  Send,
  CheckCircle2,
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
  Radio,
  Compass,
  Check,
  X
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
   TỌA ĐỘ VÀ VÙNG HOẠT ĐỘNG CÁC QUẬN TP.HCM (HỖ TRỢ BẢN ĐỒ RADAR)
   ========================================================================== */
const DISTRICT_CENTERS = {
  'Quận 1': { x: 50, y: 50, lat: 10.7769, lng: 106.7009 },
  'Quận 3': { x: 42, y: 44, lat: 10.7844, lng: 106.6844 },
  'Quận 5': { x: 38, y: 58, lat: 10.7554, lng: 106.6672 },
  'Quận 7': { x: 62, y: 78, lat: 10.7329, lng: 106.7188 },
  'Quận 10': { x: 40, y: 50, lat: 10.7679, lng: 106.6667 },
  'Bình Thạnh': { x: 58, y: 35, lat: 10.8030, lng: 106.6990 },
  'Tân Bình': { x: 32, y: 36, lat: 10.7992, lng: 106.6543 },
  'Gò Vấp': { x: 42, y: 22, lat: 10.8387, lng: 106.6657 },
  'TP. Thủ Đức': { x: 78, y: 32, lat: 10.8499, lng: 106.7717 },
  'TP.HCM': { x: 50, y: 50, lat: 10.7769, lng: 106.7009 }
};

function getCoordsFromArea(areaStr, idSeed = 1) {
  for (const [dist, pos] of Object.entries(DISTRICT_CENTERS)) {
    if (areaStr && areaStr.includes(dist)) {
      const offsetX = ((idSeed * 17) % 11) - 5;
      const offsetY = ((idSeed * 23) % 11) - 5;
      return { x: Math.min(92, Math.max(8, pos.x + offsetX)), y: Math.min(92, Math.max(8, pos.y + offsetY)) };
    }
  }
  const defaultPos = DISTRICT_CENTERS['Quận 1'];
  return { x: defaultPos.x + ((idSeed * 13) % 9) - 4, y: defaultPos.y + ((idSeed * 19) % 9) - 4 };
}

/* ==========================================================================
   1. MÀN HÌNH CHÍNH & BẢN ĐỒ THỢ (DASHBOARD & RADAR MAP)
   ========================================================================== */
export function DispatcherDashboard() {
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=50', 15000);
  const pendingOrders = useData('/orders?status=ChoPhanCong&pageSize=50', 15000);
  const activeOrders = useData('/orders?status=DangDiChuyen&pageSize=50', 15000);
  const allTechs = useData('/technicians', 15000);

  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const reload = () => {
    waitingOrders.reload();
    pendingOrders.reload();
    activeOrders.reload();
    allTechs.reload();
  };

  const techs = allTechs.data || [];
  const readyTechs = techs.filter(t => t.availability === 'SanSang');
  const busyTechs = techs.filter(t => t.availability === 'DangBan');
  const offTechs = techs.filter(t => t.availability === 'TamBan');

  // Lọc thợ hiển thị trên bản đồ
  const filteredTechs = techs.filter(t => {
    if (filterGroup !== 'ALL' && t.skillGroup !== filterGroup) return false;
    if (filterStatus !== 'ALL' && t.availability !== filterStatus) return false;
    return true;
  });

  return (
    <>
      {/* 4 Thẻ KPI tức thời */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #fbbc04' }}>
          <div className="stat-label">Chờ tiếp nhận & Báo giá <FileText size={18} /></div>
          <strong style={{ color: '#d97706' }}>{waitingOrders.data?.length ?? '…'}</strong>
          <small>Cần chẩn đoán & gửi báo giá sơ bộ</small>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Đơn chờ phân công <Users size={18} /></div>
          <strong style={{ color: '#ef4444' }}>{pendingOrders.data?.length ?? '…'}</strong>
          <small>Khách đã duyệt giá, cần giao KTV</small>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">KTV đang sẵn sàng <CheckCircle2 size={18} /></div>
          <strong style={{ color: '#10b981' }}>{readyTechs.length}</strong>
          <small>Tổng cộng {techs.length} KTV trên hệ thống</small>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-label">KTV đang làm việc <Radio size={18} /></div>
          <strong style={{ color: '#3b82f6' }}>{busyTechs.length}</strong>
          <small>{offTechs.length} thợ tạm nghỉ</small>
        </div>
      </div>

      {/* Khu vực Bản đồ Radar */}
      <Card title="Bản đồ mạng lưới kỹ thuật viên & Đơn chờ điều phối" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Lọc chuyên môn:</span>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
              <option value="ALL">Tất cả chuyên môn</option>
              {Object.entries(groups).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginLeft: '8px' }}>Trạng thái:</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SanSang">Sẵn sàng nhận việc</option>
              <option value="DangBan">Đang có ca / Bận</option>
              <option value="TamBan">Tạm nghỉ</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> KTV Sẵn sàng</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> KTV Đang bận</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Đơn chờ thợ</span>
            <button className="btn small" onClick={reload}><RefreshCw size={14} /> Làm mới</button>
          </div>
        </div>

        <div className="dpv-map-container">
          {/* Viewport Bản đồ TP.HCM tương tác */}
          <div className="dpv-map-viewport">
            <div className="dpv-map-grid-bg" />
            <div className="dpv-map-radar-center" />

            {/* Các nhãn địa bàn chính TP.HCM */}
            <div style={{ position: 'absolute', top: '48%', left: '48%', color: 'rgba(255,255,255,0.25)', fontWeight: 800, fontSize: '16px', pointerEvents: 'none' }}>QUẬN 1</div>
            <div style={{ position: 'absolute', top: '40%', left: '38%', color: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: '14px', pointerEvents: 'none' }}>QUẬN 3</div>
            <div style={{ position: 'absolute', top: '56%', left: '34%', color: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: '14px', pointerEvents: 'none' }}>QUẬN 5</div>
            <div style={{ position: 'absolute', top: '75%', left: '60%', color: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: '14px', pointerEvents: 'none' }}>QUẬN 7</div>
            <div style={{ position: 'absolute', top: '30%', left: '74%', color: 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '14px', pointerEvents: 'none' }}>TP. THỦ ĐỨC</div>
            <div style={{ position: 'absolute', top: '32%', left: '55%', color: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: '13px', pointerEvents: 'none' }}>BÌNH THẠNH</div>

            {/* Render Markers Kỹ thuật viên */}
            {filteredTechs.map(t => {
              const pos = getCoordsFromArea(t.serviceArea, t.id);
              const isSelected = selectedTech?.id === t.id;
              return (
                <div
                  key={'tech-' + t.id}
                  className={`dpv-tech-pin ${t.availability}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: isSelected ? 40 : 15 }}
                  onClick={() => { setSelectedTech(t); setSelectedOrder(null); }}
                  title={`${t.fullName} (${groups[t.skillGroup] || t.skillGroup})`}
                >
                  <div className="pulse-wave" />
                  <div className="pin-circle" style={{ transform: isSelected ? 'scale(1.3)' : 'scale(1)' }}>
                    <Users size={16} />
                  </div>
                  <div className="pin-label">{t.fullName.split(' ').slice(-2).join(' ')}</div>
                </div>
              );
            })}

            {/* Render Markers Đơn hàng chờ phân công */}
            {(pendingOrders.data || []).map(o => {
              const pos = getCoordsFromArea(o.address, o.id + 50);
              const isSelected = selectedOrder?.id === o.id;
              return (
                <div
                  key={'ord-' + o.id}
                  className="dpv-order-pin"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: isSelected ? 40 : 20 }}
                  onClick={() => { setSelectedOrder(o); setSelectedTech(null); }}
                  title={`Đơn ${code(o.id)}: ${o.serviceName}`}
                >
                  <div className="pin-box" style={{ transform: isSelected ? 'scale(1.3)' : 'scale(1)' }}>
                    <MapPin size={15} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar xem chi tiết KTV / Đơn hàng được chọn */}
          <div className="dpv-map-sidebar">
            <div className="dpv-map-sidebar-head">
              <span>{selectedTech ? 'Hồ sơ kỹ thuật viên' : selectedOrder ? 'Thông tin đơn chờ thợ' : 'Giám sát trực tuyến'}</span>
              {(selectedTech || selectedOrder) && (
                <button className="text-btn" style={{ fontSize: '12px' }} onClick={() => { setSelectedTech(null); setSelectedOrder(null); }}>Đóng</button>
              )}
            </div>

            <div className="dpv-map-sidebar-body">
              {selectedTech ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                      {selectedTech.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>{selectedTech.fullName}</h4>
                      <Badge value={selectedTech.availability} />
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569' }}>
                    <div><b>Chuyên môn:</b> {groups[selectedTech.skillGroup] || selectedTech.skillGroup}</div>
                    <div><b>Địa bàn phục vụ:</b> {selectedTech.serviceArea}</div>
                    <div><b>Số điện thoại:</b> <a href={'tel:' + selectedTech.phone} style={{ color: '#116a4e', fontWeight: 600 }}>{selectedTech.phone || '0900000000'}</a></div>
                    <div><b>Số dư ví KTV:</b> <span style={{ color: '#116a4e', fontWeight: 700 }}>{money(selectedTech.balance || 1500000)}</span></div>
                    <div><b>Đánh giá:</b> {selectedTech.averageRating ? `${Number(selectedTech.averageRating).toFixed(1)}/5 ⭐` : '5.0/5 ⭐ (Tốt)'}</div>
                    <div><b>Đơn đã hoàn thành:</b> {selectedTech.completedOrders ?? 12} đơn</div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/dispatch/assign" className="btn primary small" style={{ width: '100%', justifyContent: 'center' }}>
                      <Users size={15} /> Giao việc cho KTV này
                    </Link>
                    <a href={'tel:' + (selectedTech.phone || '')} className="btn small" style={{ width: '100%', justifyContent: 'center' }}>
                      <Phone size={15} /> Liên hệ điều phối
                    </a>
                  </div>
                </div>
              ) : selectedOrder ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <b style={{ color: '#116a4e', fontSize: '15px' }}>{code(selectedOrder.id)}</b>
                    <Badge value={selectedOrder.status} />
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>{selectedOrder.serviceName}</h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569' }}>
                    <div><b>Khách hàng:</b> {selectedOrder.contactName} ({selectedOrder.contactPhone})</div>
                    <div><b>Địa chỉ:</b> {selectedOrder.address}</div>
                    <div><b>Hẹn lúc:</b> {date(selectedOrder.scheduledAt)}</div>
                    <div><b>Ghi chú lỗi:</b> {selectedOrder.description}</div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <Link to="/dispatch/assign" className="btn primary small" style={{ width: '100%', justifyContent: 'center' }}>
                      <Users size={15} /> Ghép thợ ngay
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '30px 10px' }}>
                  <Compass size={36} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#334155' }}>Chọn một Thợ hoặc Đơn hàng</p>
                  <small>Nhấp vào các điểm trên bản đồ radar để kiểm tra thông tin chi tiết và điều phối tức thời.</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ==========================================================================
   2. MÀN HÌNH CHẨN ĐOÁN LỖI TỪ XA (VIDEO CALL, CHAT, MEDIA INSPECTOR)
   ========================================================================== */
export function RemoteDiagnostics() {
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=20');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const a = useAction();

  // Đơn được chọn
  const orders = waitingOrders.data || [];
  const currentOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  // Dữ liệu ảnh đính kèm của đơn
  // Ảnh đính kèm sự cố của đơn hàng (OrderFault)
  const orderFiles = useData(currentOrder ? `/orders/${currentOrder.id}/attachments` : null);
  const faultPhotos = (orderFiles.data || []).filter(f => f.purpose === 'OrderFault');

  // Trạng thái Video Call
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Đếm thời gian gọi khi đang gọi
  useEffect(() => {
    let timer;
    if (isCalling) {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  // Trạng thái Chat kỹ thuật
  const [chatMessages, setChatMessages] = useState([
    { sender: 'customer', text: 'Chào điều phối viên, máy lạnh nhà tôi chớp đèn đỏ liên tục, không mát.', time: '10:15' },
    { sender: 'dpv', text: 'Dạ chào anh/chị. Anh/chị cho em hỏi đèn chớp mấy nhịp, và cánh đảo gió có mở ra không ạ?', time: '10:16' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Phiếu kết luận chẩn đoán
  const [diagnosticCode, setDiagnosticCode] = useState('F95 - Rò rỉ gas / Áp suất dàn nóng');
  const [severity, setSeverity] = useState('Medium');
  const [diagnosisNote, setDiagnosisNote] = useState('Dàn lạnh đóng tuyết một phần, quạt chạy yếu. Nghi ngờ xì đầu nối tán rắc co ống đồng hoặc thiếu gas.');

  const sendChat = (textToSend) => {
    const txt = textToSend || chatInput;
    if (!txt.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: 'dpv', text: txt, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    if (!textToSend) setChatInput('');
  };

  const saveDiagnosticNote = () => {
    if (!currentOrder) return;
    a.run(async () => {
      await api(`/orders/${currentOrder.id}/notes`, {
        method: 'POST',
        body: {
          text: `[CHẨN ĐOÁN TỪ XA]\nMã lỗi: ${diagnosticCode}\nMức độ: ${severity}\nKết luận: ${diagnosisNote}`,
          visibility: 'Customer',
          expectedVersion: currentOrder.version
        }
      });
      alert('Đã lưu kết quả chẩn đoán vào hồ sơ đơn hàng!');
    }, 'Đã cập nhật chẩn đoán từ xa.');
  };

  return (
    <>
      {/* Thanh chọn đơn cần chẩn đoán */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Video size={20} style={{ color: '#116a4e' }} />
          <div>
            <b style={{ fontSize: '15px' }}>Không gian chẩn đoán từ xa</b>
            <small style={{ display: 'block', color: '#64748b' }}>Hỗ trợ khách hàng qua Video Call, kiểm tra ảnh chụp hiện trường và xác định lỗi trước khi điều thợ.</small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Chọn đơn:</span>
          <select
            value={currentOrder?.id || ''}
            onChange={e => setSelectedOrderId(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#116a4e' }}
          >
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {code(o.id)} · {o.serviceName} ({o.contactName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentOrder ? (
        <Empty title="Chưa có đơn chờ chẩn đoán" text="Hiện không có đơn hàng nào ở trạng thái chờ tiếp nhận." />
      ) : (
        <div className="dpv-diag-layout">
          {/* CỘT 1: THƯ VIỆN ẢNH & THÔNG TIN SỰ CỐ */}
          <div className="dpv-panel">
            <div className="dpv-panel-head">
              <span>Ảnh & Video sự cố khách gửi</span>
              <Camera size={16} style={{ color: '#64748b' }} />
            </div>
            <div className="dpv-panel-body">
              {/* Thông tin đơn hàng */}
              <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#116a4e', display: 'block', marginBottom: '4px' }}>{currentOrder.serviceName}</b>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>{currentOrder.description}</p>
                <small style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {currentOrder.address}</small>
                {/* Nút gọi điện trực tiếp cho khách */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${currentOrder.contactPhone}`}
                    className="btn small"
                    style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={`Gọi điện thoại cho ${currentOrder.contactName}`}
                  >
                    <Phone size={14} /> Gọi khách
                  </a>
                  <button
                    className="btn primary small"
                    style={{ flex: 1 }}
                    onClick={() => setIsCalling(true)}
                    title="Bắt đầu phiên Video Call chẩn đoán"
                  >
                    <Video size={14} /> Video Call
                  </button>
                </div>
              </div>

              {/* Ảnh sự cố từ khách hàng */}
              {orderFiles.loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>Đang tải ảnh...</div>
              )}
              {!orderFiles.loading && faultPhotos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', border: '2px dashed #e2e8f0', borderRadius: '10px', color: '#94a3b8' }}>
                  <Camera size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Khách chưa tải ảnh sự cố lên</p>
                  <small>Yêu cầu khách chụp ảnh qua Video Call</small>
                </div>
              )}
              {faultPhotos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {faultPhotos.map((f, idx) => (
                    <div key={f.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0f172a' }}>
                      <div style={{ display: 'block' }}>
                        <ProtectedImage id={f.id} alt={`Ảnh sự cố ${idx + 1}`} />
                      </div>
                      <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '4px', pointerEvents: 'none' }}>
                        Ảnh {idx + 1}{f.originalName ? ': ' + f.originalName : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Nhãn khuyết tật sơ bộ từ mô tả đơn */}
              {currentOrder.description && (
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Mô tả sự cố của khách:</span>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#374151', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #10b981', lineHeight: '1.5' }}>
                    {currentOrder.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT 2: KHUNG VIDEO CALL TRỰC TIẾP */}
          <div className="dpv-panel">
            <div className="dpv-panel-head">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Phòng Video Call trực tuyến
                {isCalling && (
                  <span className="dpv-call-badge">
                    <span className="dot" /> LIVE ({String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')})
                  </span>
                )}
              </span>
              {/* Nút gọi điện thoại trực tiếp (tel:) */}
              {!isCalling && currentOrder.contactPhone && (
                <a
                  href={`tel:${currentOrder.contactPhone}`}
                  title={`Gọi trực tiếp ${currentOrder.contactName}: ${currentOrder.contactPhone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#116a4e', fontWeight: 600, textDecoration: 'none', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px' }}
                >
                  <Phone size={13} /> {currentOrder.contactPhone}
                </a>
              )}
            </div>

            <div className="dpv-video-screen">
              <div className="dpv-video-feed">
                {isCalling ? (
                  <div style={{ textAlign: 'center', width: '100%', height: '100%', position: 'relative' }}>
                    {/* Mô phỏng khung hình camera từ khách hàng */}
                    <img
                      src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
                      alt="Khách hàng đang quay thiết bị"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    />
                    <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.65)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Camera: <b>{currentOrder.contactName}</b>
                    </div>
                    {/* Ảnh chụp nháy thành công */}
                    {snapshotTaken && (
                      <div style={{ position: 'absolute', inset: 0, border: '4px solid #10b981', borderRadius: '4px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '6px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}>📸 Đã chụp ảnh!</span>
                      </div>
                    )}
                    {/* Màn hình PIP góc của Điều phối viên */}
                    <div className="dpv-video-pip">
                      {isVideoOff ? (
                        <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <VideoOff size={20} style={{ color: '#64748b' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600, flexDirection: 'column', gap: '4px' }}>
                          <Users size={18} />
                          <span>Điều Phối Viên</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 20px' }}>
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 0 8px rgba(16,185,129,0.12)' }}>
                      <Video size={30} style={{ color: '#10b981' }} />
                    </div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#f1f5f9' }}>Sẵn sàng gọi Video Call cho khách</h3>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#94a3b8' }}>
                      <b style={{ color: '#e2e8f0' }}>{currentOrder.contactName}</b>
                    </p>
                    <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748b' }}>{currentOrder.contactPhone}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a
                        href={`tel:${currentOrder.contactPhone}`}
                        className="btn small"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                      >
                        <Phone size={14} /> Gọi điện thoại
                      </a>
                      <button className="btn primary" onClick={() => setIsCalling(true)} style={{ gap: '8px' }}>
                        <Video size={15} /> Bắt đầu Video Call
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Toolbar điều khiển cuộc gọi */}
              {isCalling && (
                <div className="dpv-video-controls">
                  <button className={`dpv-call-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)} title={isMuted ? 'Bật micro' : 'Tắt micro'}>
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button className={`dpv-call-btn ${isVideoOff ? 'active' : ''}`} onClick={() => setIsVideoOff(!isVideoOff)} title={isVideoOff ? 'Bật camera' : 'Tắt camera'}>
                    {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>
                  <button className="dpv-call-btn" onClick={() => { setSnapshotTaken(true); setTimeout(() => setSnapshotTaken(false), 2000); }} title="Chụp ảnh hiện trường">
                    <Camera size={18} />
                  </button>
                  <button className="dpv-call-btn" title="Chia sẻ màn hình / sơ đồ kỹ thuật">
                    <Share2 size={18} />
                  </button>
                  <button className="dpv-call-btn danger" onClick={() => setIsCalling(false)} title="Kết thúc cuộc gọi">
                    <PhoneOff size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CỘT 3: CHAT KỸ THUẬT & PHIẾU CHẨN ĐOÁN */}
          <div className="dpv-panel dpv-panel-col3">
            <div className="dpv-panel-head">
              <span>Hỏi đáp & Phiếu chẩn đoán</span>
              <MessageSquare size={16} style={{ color: '#64748b' }} />
            </div>

            {/* Khu vực scroll chứa toàn bộ nội dung cột 3 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Khung chat */}
              <div className="dpv-chat-messages" style={{ flex: '0 0 auto', maxHeight: '180px', minHeight: '120px' }}>
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`dpv-chat-bubble ${m.sender}`}>
                    <div>{m.text}</div>
                    <small style={{ fontSize: '10px', opacity: 0.7, marginTop: 4, display: 'block', textAlign: m.sender === 'dpv' ? 'right' : 'left' }}>{m.time}</small>
                  </div>
                ))}
              </div>

              {/* Quick Prompts */}
              <div className="dpv-quick-prompts" style={{ flex: '0 0 auto' }}>
                <span className="dpv-prompt-chip" onClick={() => sendChat('Khách hàng vui lòng kiểm tra mã lỗi hiển thị trên remote?')}>Mã lỗi remote?</span>
                <span className="dpv-prompt-chip" onClick={() => sendChat('Đã ngắt aptomat để đảm bảo an toàn chưa ạ?')}>Ngắt aptomat?</span>
                <span className="dpv-prompt-chip" onClick={() => sendChat('Thiết bị có phát ra mùi khét hoặc tiếng kêu lạ không?')}>Mùi khét / tiếng kêu?</span>
              </div>

              {/* Input Chat */}
              <div style={{ display: 'flex', gap: '6px', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flex: '0 0 auto', background: '#fff' }}>
                <input
                  type="text"
                  placeholder="Nhắn tin với khách hàng..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button className="btn primary small" onClick={() => sendChat()}><Send size={14} /></button>
              </div>

              {/* Phiếu kết luận chẩn đoán */}
              <div style={{ flex: '0 0 auto', padding: '14px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <b style={{ fontSize: '13px', display: 'block', marginBottom: '10px', color: '#1e293b' }}>Kết luận chẩn đoán kỹ thuật:</b>
                <Field label="Mã lỗi dự đoán">
                  <input type="text" value={diagnosticCode} onChange={e => setDiagnosticCode(e.target.value)} />
                </Field>
                <Field label="Mức độ nghiêm trọng">
                  <select value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="Normal">Bình thường (sửa trong ngày)</option>
                    <option value="Medium">Cần gấp (trong vòng 2 giờ)</option>
                    <option value="Critical">Khẩn cấp (nguy cơ rò rỉ điện/cháy)</option>
                  </select>
                </Field>
                <Field label="Mô tả nguyên nhân & đề xuất">
                  <textarea rows={3} value={diagnosisNote} onChange={e => setDiagnosisNote(e.target.value)} style={{ resize: 'vertical' }} />
                </Field>

                {/* Nút Lưu & Lập báo giá – luôn hiển thị */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    className="btn small"
                    onClick={saveDiagnosticNote}
                    disabled={a.busy}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {a.busy ? '...' : 'Lưu vào đơn'}
                  </button>
                  <Link
                    to={`/dispatch/quotes?orderId=${currentOrder.id}`}
                    className="btn primary small"
                    style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Lập báo giá <ArrowRight size={14} />
                  </Link>
                </div>
                {a.error && <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>Lỗi: {a.error.message}</div>}
                {a.success && <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>✓ {a.success}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ==========================================================================
   3. MÀN HÌNH LẬP & GỬI BÁO GIÁ SƠ BỘ
   ========================================================================== */
export function PreliminaryQuoteManager() {
  const waitingOrders = useData('/orders?status=ChoTiepNhan&pageSize=50');
  const a = useAction();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState({
    diagnosis: 'Kiểm tra máy lạnh, xử lý nghẹt máng xả nước thải, vệ sinh lưới lọc và nạp gas bổ sung R32.',
    inspectionFee: '50000',
    laborFee: '150000',
    commissionPercent: '15'
  });

  const orders = waitingOrders.data || [];

  // Mẫu chẩn đoán sẵn
  const TEMPLATES = [
    { label: 'Điện lạnh - Chảy nước & Thiếu gas', text: 'Kiểm tra đường thoát nước máy lạnh, vệ sinh máng hứng, xử lý mối hở tán đồng và nạp gas bổ sung.' },
    { label: 'Điện nước - Rò rỉ ống dẫn', text: 'Kiểm tra áp lực đường nước, thay thế đoạn ống nhiệt PPR bị nứt vỡ, quấn cao su non và thay ren nối.' },
    { label: 'Gia dụng - Hỏng tụ & Kẹt động cơ', text: 'Kiểm tra nguồn cấp bo mạch, thay thế tụ khởi động quạt/máy giặt, vệ sinh tra dầu bảo dưỡng.' },
    { label: 'Vệ sinh - Bảo trì định kỳ', text: 'Tháo vệ sinh lồng giặt / dàn lạnh bằng máy phun áp lực cao, khử khuẩn và chạy test tải nghiệm thu.' }
  ];

  const handleSelectOrder = (o) => {
    setSelectedOrder(o);
    // Tùy theo nhóm dịch vụ gán mẫu chẩn đoán thích hợp
    if (o.serviceGroup === 'DienLanh') {
      setForm(f => ({ ...f, diagnosis: TEMPLATES[0].text, laborFee: '150000' }));
    } else if (o.serviceGroup === 'DienNuoc') {
      setForm(f => ({ ...f, diagnosis: TEMPLATES[1].text, laborFee: '120000' }));
    } else {
      setForm(f => ({ ...f, diagnosis: TEMPLATES[2].text, laborFee: '180000' }));
    }
  };

  const submitQuote = () => {
    if (!selectedOrder) return;
    a.run(async () => {
      await api(`/orders/${selectedOrder.id}/preliminary-quotes`, {
        method: 'POST',
        body: {
          diagnosis: form.diagnosis,
          expectedVersion: selectedOrder.version
        }
      });
      setSelectedOrder(null);
      waitingOrders.reload();
      alert('Đã gửi báo giá sơ bộ cho khách hàng duyệt thành công!');
    }, 'Đã gửi báo giá sơ bộ thành công.');
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* Danh sách đơn chờ lập báo giá */}
        <Card title={`Đơn chờ lập báo giá (${orders.length})`}>
          <ErrorBox error={waitingOrders.error} />
          {waitingOrders.loading ? <Loading /> : !orders.length ? (
            <Empty title="Không có đơn chờ tiếp nhận" text="Tất cả các đơn đã được lập báo giá sơ bộ." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map(o => {
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => handleSelectOrder(o)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid ' + (isSelected ? '#116a4e' : '#e2e8f0'),
                      background: isSelected ? '#f0faf5' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <b style={{ color: '#116a4e' }}>{code(o.id)}</b>
                      <small style={{ color: '#64748b' }}>{date(o.createdAt)}</small>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{o.serviceName}</div>
                    <div style={{ color: '#475569', fontSize: '12.5px' }}>{o.contactName} · {o.contactPhone}</div>
                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>📍 {o.address}</small>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Panel Form lập báo giá sơ bộ */}
        <Card title={selectedOrder ? `Lập báo giá sơ bộ · ${code(selectedOrder.id)}` : 'Chi tiết báo giá sơ bộ'}>
          {!selectedOrder ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontWeight: 600, color: '#334155' }}>Chọn một đơn hàng bên trái để tiến hành lập báo giá sơ bộ</p>
              <small>Hệ thống tự động đồng bộ phí kiểm tra và tiền công tiêu chuẩn từ danh mục dịch vụ.</small>
            </div>
          ) : (
            <div>
              {/* Thông tin đơn */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><b>Dịch vụ yêu cầu:</b> {selectedOrder.serviceName}</div>
                  <div><b>Nhóm chuyên môn:</b> {groups[selectedOrder.serviceGroup] || selectedOrder.serviceGroup}</div>
                  <div><b>Khách hàng:</b> {selectedOrder.contactName} ({selectedOrder.contactPhone})</div>
                  <div><b>Địa chỉ thi công:</b> {selectedOrder.address}</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  <b>Mô tả của khách:</b> <i>"{selectedOrder.description}"</i>
                </div>
              </div>

              {/* Mẫu gợi ý chẩn đoán nhanh */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>Mẫu gợi ý chẩn đoán nhanh:</span>
                <div className="dpv-template-list">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="dpv-template-btn"
                      onClick={() => setForm(f => ({ ...f, diagnosis: tmpl.text }))}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Chẩn đoán nguyên nhân & Phương án xử lý (Khách hàng sẽ đọc nội dung này)">
                <textarea
                  rows={3}
                  required
                  value={form.diagnosis}
                  onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                />
              </Field>

              {/* Bảng chi phí sơ bộ */}
              <div className="dpv-quote-card">
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a' }}>Dự toán chi phí sơ bộ</h4>
                <div className="dpv-fee-row">
                  <span>Phí kiểm tra niêm yết (Cố định):</span>
                  <b>{money(form.inspectionFee)}</b>
                </div>
                <div className="dpv-fee-row">
                  <span>Tiền công ước tính (Theo danh mục):</span>
                  <b>{money(form.laborFee)}</b>
                </div>
                <div className="dpv-fee-row">
                  <span>Hoa hồng nền tảng ({form.commissionPercent}% tiền công):</span>
                  <span style={{ color: '#64748b' }}>{money(Number(form.laborFee) * 0.15)}</span>
                </div>
                <div className="dpv-fee-row">
                  <span>Tổng chi phí sơ bộ khách cần duyệt:</span>
                  <span>{money(Number(form.inspectionFee) + Number(form.laborFee))}</span>
                </div>
              </div>

              <ErrorBox error={a.error} />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn" type="button" onClick={() => setSelectedOrder(null)}>Hủy chọn</button>
                <Submit busy={a.busy} onClick={submitQuote}>
                  <Send size={16} /> Gửi báo giá sơ bộ cho khách duyệt
                </Submit>
              </div>
            </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
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
  const activeOrders = useData('/orders?pageSize=50');
  const cancelledOrders = useData('/orders?status=Huy&pageSize=50');
  const a = useAction();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Khách hàng đổi ý, không còn nhu cầu sửa chữa');
  const [customNote, setCustomNote] = useState('');

  const REASONS = [
    'Khách hàng đổi ý, không còn nhu cầu sửa chữa',
    'Khách đã tự khắc phục được sự cố tạm thời',
    'Không liên lạc được với khách hàng qua số điện thoại',
    'Kỹ thuật viên gặp sự cố bất khả kháng trên đường di chuyển',
    'Thiết bị hỏng hóc quá nặng, khách từ chối chi phí sửa',
    'Sai lệch thông tin địa chỉ hoặc ngoài phạm vi phục vụ'
  ];

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    const finalReason = customNote ? `${cancelReason} (${customNote})` : cancelReason;

    a.run(async () => {
      await api(`/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        body: {
          reason: finalReason,
          expectedVersion: selectedOrder.version
        }
      });
      setSelectedOrder(null);
      setCustomNote('');
      activeOrders.reload();
      cancelledOrders.reload();
      alert('Đã xử lý hủy đơn hàng thành công theo quy chuẩn!');
    }, 'Đã hủy đơn hàng thành công.');
  };

  const isEnRoute = selectedOrder?.status === 'DangDiChuyen';
  const travelFee = isEnRoute ? 50000 : 0;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px' }}>
        {/* Bảng quản lý & chọn đơn cần hủy */}
        <div>
          <Card title="Danh sách đơn hàng có thể xử lý hủy">
            <ErrorBox error={activeOrders.error} />
            {activeOrders.loading ? <Loading /> : (
              <Table
                headers={['Mã đơn', 'Dịch vụ', 'Khách hàng', 'Trạng thái hiện tại', 'KTV phụ trách', 'Thao tác']}
                rows={(activeOrders.data || []).filter(o => !['HoanThanh', 'Huy'].includes(o.status))}
                empty="Không có đơn hàng nào đang trong tiến trình."
                render={o => {
                  const isSelected = selectedOrder?.id === o.id;
                  const enRoute = o.status === 'DangDiChuyen';

                  return (
                    <tr key={o.id} style={{ background: isSelected ? '#fef2f2' : undefined }}>
                      <td><b>{code(o.id)}</b></td>
                      <td>{o.serviceName}</td>
                      <td>{o.contactName}<small>{o.contactPhone}</small></td>
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

        {/* Panel Form xác nhận hủy & Áp dụng phí di chuyển */}
        <div>
          <Card title="Xử lý hủy đơn & Phí bồi hoàn di chuyển">
            {!selectedOrder ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748b' }}>
                <Ban size={36} style={{ color: '#fca5a5', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 600, color: '#334155' }}>Chọn một đơn hàng bên trái để thực hiện hủy</p>
                <small>Hệ thống tự động áp dụng quy tắc tính phí di chuyển 50.000đ khi thợ đã bắt đầu di chuyển.</small>
              </div>
            ) : (
              <div>
                <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ color: '#116a4e', fontSize: '15px' }}>{code(selectedOrder.id)}</b>
                    <Badge value={selectedOrder.status} />
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13px' }}>
                    <div><b>Dịch vụ:</b> {selectedOrder.serviceName}</div>
                    <div><b>Khách hàng:</b> {selectedOrder.contactName} ({selectedOrder.contactPhone})</div>
                    <div><b>KTV:</b> {selectedOrder.technicianName || 'Chưa gán thợ'}</div>
                  </div>
                </div>

                {/* Banner giải trình quy tắc tính phí di chuyển */}
                {isEnRoute ? (
                  <div className="dpv-cancel-notice danger">
                    <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <b>ÁP DỤNG PHÍ DI CHUYỂN: 50.000đ</b>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                        Kỹ thuật viên đang trên đường di chuyển đến nhà khách. Theo quy chế HomeFix, hệ thống ghi nhận khoản phải thu 50.000đ từ khách hàng nhằm bồi hoàn chi phí xăng xe và công sức di chuyển của thợ.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="dpv-cancel-notice warning">
                    <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <b>HỦY MIỄN PHÍ (0đ)</b>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                        Đơn hàng chưa bắt đầu di chuyển. Khách hàng và thợ được miễn phí hủy đơn hoàn toàn.
                      </p>
                    </div>
                  </div>
                )}

                <div className="dpv-cancel-fee-box">
                  <span style={{ fontWeight: 600 }}>Phí di chuyển áp dụng:</span>
                  <b style={{ fontSize: '18px', color: isEnRoute ? '#dc2626' : '#116a4e' }}>
                    {money(travelFee)}
                  </b>
                </div>

                <Field label="Lý do hủy tiêu chuẩn">
                  <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                    {REASONS.map((r, idx) => <option key={idx} value={r}>{r}</option>)}
                  </select>
                </Field>

                <Field label="Ghi chú bổ sung của điều phối viên">
                  <textarea
                    rows={2}
                    placeholder="Nhập thông tin chi tiết giải trình việc hủy đơn..."
                    value={customNote}
                    onChange={e => setCustomNote(e.target.value)}
                  />
                </Field>

                <ErrorBox error={a.error} />

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>Hủy bỏ</button>
                  <button className="btn primary" style={{ flex: 1.5, background: '#dc2626', borderColor: '#dc2626' }} disabled={a.busy} onClick={handleCancelOrder}>
                    <Ban size={15} /> Xác nhận hủy đơn
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
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

export function DispatcherHub({ initialTab = 'dashboard' }) {
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
      dashboard: '/dispatch',
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
        text="Giám sát thợ trên bản đồ radar, chẩn đoán lỗi từ xa, lập báo giá sơ bộ, ghép thợ thông minh và xử lý hủy đơn bồi hoàn phí di chuyển."
      >
        <Link to="/orders" className="btn"><FileText size={16} /> Danh sách tất cả đơn</Link>
      </PageHead>

      {/* Thanh điều hướng 5 Module chuyên sâu */}
      <div className="dpv-hub-nav">
        <button
          className={`dpv-hub-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => switchTab('dashboard')}
        >
          <LayoutDashboard size={17} />
          Bản đồ thợ & Radar
        </button>

        <button
          className={`dpv-hub-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => switchTab('diagnostics')}
        >
          <Video size={17} />
          Chẩn đoán từ xa (Video & Chat)
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
      {activeTab === 'dashboard' && <DispatcherDashboard />}
      {activeTab === 'diagnostics' && <RemoteDiagnostics />}
      {activeTab === 'quotes' && <PreliminaryQuoteManager />}
      {activeTab === 'assign' && <SmartDispatchCenter />}
      {activeTab === 'cancellations' && <CancellationManager />}
    </>
  );
}
