import { notificationPath } from './notification-bell';
import { MultiServiceBooking, ServiceOrders } from './service-orders';
import { AssignmentAlerts } from './assignment-alerts';
import { PasswordChange } from './auth-forms';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Snowflake,
  Refrigerator,
  WashingMachine,
  PlugZap,
  Droplets,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  Wallet,
  CalendarDays,
  Bell,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  ArrowDownUp,
  ReceiptText,
  AlertTriangle,
  Download,
  UsersRound,
  ClipboardCheck,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { api, upload } from './api';
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
  OrderCard,
  Badge,
  money,
  date,
  groups,
  roleNames,
  labels,
} from './shared';
const icons = [Snowflake, Sparkles, Refrigerator, WashingMachine, PlugZap, Droplets];
function ServiceCards({ services }) {
  return (
    <div className="service-grid">
      {services.map((s, i) => {
        const Icon = icons[i % icons.length];
        return (
          <Link className="service-card" to={'/book/' + s.id} key={s.id}>
            <div className={'service-art color-' + (i % 4)}>
              <Icon size={47} strokeWidth={1.5} />
              <span>{groups[s.groupCode]}</span>
            </div>
            <div className="service-copy">
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <div className="service-price">
                <div>
                  <small>Tiền công tham khảo</small>
                  <strong>{money(s.laborFee)}</strong>
                </div>
                <span className="circle-arrow">
                  <ArrowRight size={18} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
export function Dashboard() {
  const { user } = useApp();
  if (user.role === 'KH') return <CustomerHome />;
  if (user.role === 'KTV') return <TechnicianHome />;
  if (user.role === 'KT') return <FinanceDashboard />;
  if (user.role === 'GD')
    return new URLSearchParams(window.location.search).get('tab') === 'policies' ? (
      <PolicyApproval />
    ) : (
      <ExecutiveDashboard />
    );
  return <StaffHome />;
}
function CustomerHome() {
  const { user } = useApp(),
    services = useData('/services'),
    orders = useData('/service-orders?pageSize=5', 10000);
  return (
    <>
      <section className="customer-hero">
        <div>
          <span className="eyebrow">CHĂM SÓC NHÀ CỬA, THẬT DỄ DÀNG</span>
          <h1>
            Nhà cần sửa?
            <br />
            <em>Đã có HomeFix.</em>
          </h1>
          <p>
            Chào {user.fullName.split(' ').at(-1)}, đặt dịch vụ ngay để thiết bị trong nhà luôn hoạt
            động tốt.
          </p>
          <Link to="/services" className="btn primary">
            Đặt dịch vụ ngay <ArrowRight size={18} />
          </Link>
          <div className="hero-trust">
            <span>
              <ShieldCheck /> Giá rõ ràng
            </span>
            <span>
              <Clock /> Đặt lịch thuận tiện
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-circle">
            <WashingMachine size={118} strokeWidth={1} />
            <span className="orbit one">
              <Snowflake />
            </span>
            <span className="orbit two">
              <PlugZap />
            </span>
            <span className="orbit three">
              <Droplets />
            </span>
          </div>
          <div className="hero-label">
            <ShieldCheck size={22} />
            <div>
              <b>An tâm từng dịch vụ</b>
              <small>Xác nhận trước khi sửa chữa</small>
            </div>
          </div>
        </div>
      </section>
      <div className="section-head">
        <div>
          <span className="eyebrow">GIẢI PHÁP CHO NGÔI NHÀ</span>
          <h2>Dịch vụ phổ biến</h2>
        </div>
        <Link to="/services" className="text-link">
          Xem tất cả <ArrowRight size={16} />
        </Link>
      </div>
      <ErrorBox error={services.error} />
      {services.loading ? (
        <Loading />
      ) : (
        services.data && (
          <ServiceCards services={services.data.filter((s) => s.isPopular).slice(0, 6)} />
        )
      )}
      <div className="section-head">
        <h2>Đơn dịch vụ gần đây</h2>
        <Link className="text-link" to="/orders">
          Xem lịch sử <ArrowRight size={16} />
        </Link>
      </div>
      <ErrorBox error={orders.error} />
      {orders.data?.length ? (
        <div className="order-list">
          {orders.data.slice(0, 3).map((o) => (
            <Card key={o.MaDonHang} title={`Đơn DH-${String(o.MaDonHang).padStart(6, '0')}`}>
              <p>{o.items.map((item) => item.serviceName).join(' · ')}</p>
              <Badge value={o.status} />{' '}
              <Link className="btn" to={'/service-orders/' + o.MaDonHang}>
                Xem đơn và các dịch vụ
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          title="Bạn chưa có đơn dịch vụ"
          text="Khi cần sửa chữa hoặc bảo trì, bạn có thể đặt dịch vụ trong vài bước."
        />
      )}
      <div className="benefit-row">
        <div>
          <ShieldCheck />
          <h3>Báo giá minh bạch</h3>
          <p>Xem báo giá và thống nhất chi phí trước khi sửa chữa.</p>
        </div>
        <div>
          <CalendarDays />
          <h3>Chủ động thời gian</h3>
          <p>Đặt ngay hoặc chọn lịch hẹn phù hợp.</p>
        </div>
        <div>
          <Star />
          <h3>Lắng nghe phản hồi</h3>
          <p>Đánh giá và gửi yêu cầu hỗ trợ sau dịch vụ.</p>
        </div>
      </div>
    </>
  );
}
function TechnicianHome() {
  const me = useData('/technicians/me', 10000),
    orders = useData('/orders?pageSize=20', 10000),
    income = useData('/technicians/me/income?today=1', 15000),
    action = useAction();
  const active = orders.data?.filter((o) => !['HoanThanh', 'Huy'].includes(o.status)) || [];
  return (
    <>
      <PageHead
        eyebrow="HOMEFIX PARTNER"
        title="Sẵn sàng cho một ngày làm việc?"
        text="Theo dõi ca làm, phản hồi lệnh và cập nhật tiến độ tại đây."
      />
      <ErrorBox error={me.error || orders.error || action.error} />
      <AssignmentAlerts orders={active} />
      {me.data && (
        <>
          <div className="availability-card">
            <div>
              <span className="eyebrow">TRẠNG THÁI LÀM VIỆC</span>
              <h2>
                <span
                  className={'status-dot ' + (me.data.availability === 'SanSang' ? 'on' : '')}
                />
                {labels[me.data.availability]}
              </h2>
              <p>
                {groups[me.data.skillGroup]} · {me.data.serviceArea}
              </p>
            </div>
            <button
              className={'btn ' + (me.data.availability === 'SanSang' ? '' : 'primary')}
              role="switch"
              aria-checked={me.data.availability === 'SanSang'}
              aria-label="Sẵn sàng nhận việc"
              disabled={
                action.busy ||
                !!me.data.activeAssignmentSummary ||
                (me.data.availability !== 'SanSang' &&
                  Number(me.data.balance) < Number(me.data.walletEligibility.minimum))
              }
              onClick={() =>
                action.run(async () => {
                  await api('/technicians/me/availability', {
                    method: 'PATCH',
                    body: {
                      availability: me.data.availability === 'SanSang' ? 'TamBan' : 'SanSang',
                      expectedVersion: me.data.version,
                    },
                  });
                  me.reload();
                })
              }
            >
              {me.data.availability === 'SanSang' ? 'Tạm nghỉ' : 'Bật sẵn sàng'}
            </button>
          </div>
          <div className="stat-grid three">
            <Stat label="Số dư ví" value={money(me.data.balance)} icon={Wallet} />
            <Stat
              label="Thu nhập hôm nay"
              value={
                income.error ? 'Chưa tải được' : income.loading ? '…' : money(income.data?.income)
              }
              icon={Wallet}
            />
            <Stat label="Công việc đang giữ" value={active.length} icon={Clock} />
            <Stat
              label="Đánh giá trung bình"
              value={
                me.data.averageRating ? Number(me.data.averageRating).toFixed(1) + '/5' : 'Chưa có'
              }
              icon={Star}
            />
          </div>
          {Number(me.data.balance) < Number(me.data.walletEligibility.minimum) && (
            <div className="notice warning">
              Ví cần tối thiểu {money(me.data.walletEligibility.minimum)} để nhận việc.{' '}
              <Link className="btn reject-order" to="/wallet?request=Deposit">
                Nạp tiền ngay
              </Link>
            </div>
          )}
        </>
      )}
      <div className="section-head">
        <h2>Công việc cần xử lý</h2>
        <button
          className="text-btn"
          onClick={() => {
            me.reload();
            orders.reload();
          }}
        >
          <RefreshCw size={16} /> Cập nhật
        </button>
      </div>
      {orders.loading ? (
        <Loading />
      ) : active.length ? (
        <div className="order-list">
          {active.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa có ca đang chờ"
          text="Bật sẵn sàng để điều phối viên có thể giao công việc phù hợp."
        />
      )}
    </>
  );
}
export function Stat({ label, value, icon: Icon = Clock, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {label}
        <Icon size={19} />
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function amountByWeek(rows, dateKey, amountKey) {
  const now = new Date();
  const weeks = Array.from({ length: 5 }, (_, index) => ({
    label: 'Tuần ' + (index + 1),
    amount: 0,
  }));
  for (const row of rows || []) {
    const at = new Date(row[dateKey]);
    const age = Math.floor((now - at) / 86400000);
    const slot = 4 - Math.floor(age / 7);
    if (slot >= 0 && slot < 5) weeks[slot].amount += Number(row[amountKey] || 0);
  }
  return weeks;
}
function FinanceDashboard() {
  const summary = useData('/reports/summary', 15000),
    settlements = useData('/settlements', 15000),
    walletRequests = useData('/wallet-requests', 15000);
  const pendingWallet = (walletRequests.data || []).filter((item) => item.status === 'Pending');
  const pendingCod = (settlements.data || []).filter(
    (item) => item.status === 'Pending' && item.method === 'COD',
  );
  const walletWeeks = amountByWeek(walletRequests.data, 'createdAt', 'amount');
  const codWeeks = amountByWeek(
    (settlements.data || []).filter((item) => item.method === 'COD'),
    'paidAt',
    'amount',
  );
  const peak = Math.max(
    1,
    ...walletWeeks.map((item) => item.amount),
    ...codWeeks.map((item) => item.amount),
  );
  const recent = [
    ...pendingWallet.map((item) => ({
      type: 'wallet',
      id: item.id,
      name: item.technicianName,
      amount: item.amount,
      status: item.type === 'Deposit' ? 'Chờ xác minh nạp ví' : 'Chờ duyệt rút ví',
    })),
    ...pendingCod.map((item) => ({
      type: 'cod',
      id: item.id,
      name: item.technicianName,
      amount: item.amount,
      status: 'Chờ đối soát COD',
    })),
  ].slice(0, 4);
  const errors = [summary.error, settlements.error, walletRequests.error].filter(Boolean);
  return (
    <div className="finance-dashboard">
      <div className="finance-heading">
        <div>
          <div className="breadcrumb-text">
            HomeFix <span>›</span> Tổng quan tài chính
          </div>
          <h1>Tổng quan tài chính và dòng tiền</h1>
          <p>Theo dõi tiền khách đã thanh toán, hoa hồng và các khoản cần đối soát.</p>
        </div>
        <Link className="btn finance-report-button" to="/reports">
          <Download size={17} /> Báo cáo đối soát
        </Link>
      </div>
      {errors.map((error, index) => (
        <ErrorBox error={error} key={index} />
      ))}
      <section className="finance-kpis">
        <FinanceKpi
          label="Tổng doanh thu dịch vụ"
          value={money(summary.data?.gmv)}
          detail={`${summary.data?.paidOrders || 0} đơn đã ghi nhận thanh toán`}
          tone="navy"
        />
        <FinanceKpi
          label="Thực thu chiết khấu hoa hồng sàn"
          value={money(summary.data?.commissionRevenue)}
          detail="Hoa hồng đã được kế toán đối soát"
          tone="green"
        />
        <FinanceKpi
          label="Yêu cầu Nạp / Rút chờ duyệt"
          value={`${pendingWallet.length} lệnh`}
          detail={
            pendingWallet.length ? 'Đang chờ bộ phận Kế toán xử lý' : 'Không có yêu cầu đang chờ'
          }
          tone="orange"
        />
        <FinanceKpi
          label="Tiền mặt COD chưa đối soát thợ"
          value={money(pendingCod.reduce((total, item) => total + Number(item.amount || 0), 0))}
          detail={
            pendingCod.length
              ? `Được giữ bởi ${pendingCod.length} lệnh COD`
              : 'Không có COD đang chờ đối soát'
          }
          tone="red"
        />
      </section>
      <section className="finance-panel finance-chart-panel">
        <div className="finance-panel-title">
          <div>
            <h2>Xu hướng dòng tiền 5 tuần gần đây</h2>
            <p>So sánh giá trị yêu cầu ví kỹ thuật viên và tiền COD phát sinh theo tuần.</p>
          </div>
          <div className="finance-legend">
            <span>
              <i className="wallet-bar" />
              Yêu cầu ví
            </span>
            <span>
              <i className="cod-bar" />
              Thu COD
            </span>
          </div>
        </div>
        <div className="finance-chart">
          {walletWeeks.map((week, index) => (
            <div className="finance-chart-group" key={week.label}>
              <div className="finance-bars">
                <i
                  className="wallet-bar"
                  style={{ height: (week.amount / peak) * 100 + '%' }}
                  title={money(week.amount)}
                />
                <i
                  className="cod-bar"
                  style={{ height: (codWeeks[index].amount / peak) * 100 + '%' }}
                  title={money(codWeeks[index].amount)}
                />
              </div>
              <span>{week.label}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="finance-bottom-grid">
        <section className="finance-panel">
          <div className="finance-panel-title">
            <div>
              <h2>Giao dịch gần đây cần xử lý</h2>
              <p>Các yêu cầu ví và khoản COD chưa được đối soát.</p>
            </div>
            <Link className="text-link" to="/finance">
              Mở xử lý <ArrowRight size={15} />
            </Link>
          </div>
          {recent.length ? (
            <div className="finance-transaction-list">
              {recent.map((item) => (
                <Link to="/finance" className="finance-transaction" key={item.type + '-' + item.id}>
                  <span className={'finance-dot ' + item.type} />
                  <b>
                    {item.name || 'Kỹ thuật viên'} · {item.type === 'wallet' ? 'Ví KTV' : 'COD'} ·{' '}
                    {money(item.amount)}
                  </b>
                  <small>{item.status}</small>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Không có giao dịch chờ xử lý"
              text="Các yêu cầu mới sẽ xuất hiện tại đây."
            />
          )}
        </section>
        <section className="finance-panel finance-alert-panel">
          <div className="finance-panel-title">
            <div>
              <h2>Cảnh báo tài chính</h2>
              <p>Ưu tiên xử lý các khoản tiền mặt cần đối soát.</p>
            </div>
          </div>
          <div className={pendingCod.length ? 'finance-alert warning' : 'finance-alert success'}>
            <AlertTriangle size={20} />
            <span>
              {pendingCod.length
                ? `${pendingCod.length} lệnh COD đang chờ đối soát. Mở đối soát để kiểm tra và xử lý.`
                : 'Không có khoản tiền mặt chờ đối soát.'}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
function FinanceKpi({ label, value, detail, tone }) {
  const icons = { navy: BarChart3, green: ReceiptText, orange: Wallet, red: ArrowDownUp };
  const Icon = icons[tone];
  return (
    <article className={'finance-kpi ' + tone}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <Icon size={26} />
    </article>
  );
}
function ExecutiveDashboard() {
  const summary = useData('/reports/summary', 15000),
    technicians = useData('/reports/technicians', 15000),
    proposals = useData('/director/policy-proposals', 15000);
  const techs = technicians.data || [],
    topTechs = [...techs]
      .sort((a, b) => Number(b.completedOrders || 0) - Number(a.completedOrders || 0))
      .slice(0, 5),
    activeTechs = techs.filter((tech) => tech.availability === 'SanSang').length;
  const monthData = executiveMonths(summary.data?.trend || [], summary.data?.commissionTrend || []),
    maximum = Math.max(1, ...monthData.flatMap((item) => [item.revenue, item.profit]));
  return (
    <div className="executive-dashboard">
      <div className="executive-heading">
        <div>
          <div className="breadcrumb-text">
            HomeFix <span>›</span> Tổng quan điều hành
          </div>
          <h1>Tổng quan vận hành và doanh thu</h1>
          <p>Hệ thống báo cáo vận hành và phân tích xu hướng dịch vụ của nền tảng.</p>
        </div>
      </div>
      <ErrorBox error={summary.error || technicians.error || proposals.error} />
      <section className="executive-kpis">
        <ExecutiveKpi
          label="Tổng giá trị đã thu"
          value={money(summary.data?.gmv)}
          note={`${summary.data?.paidOrders || 0} công việc đã thanh toán`}
          icon={TrendingUp}
          tone="green"
        />
        <ExecutiveKpi
          label="Hoa hồng đã thu"
          value={money(summary.data?.commissionRevenue)}
          note="Hoa hồng đã đối soát"
          icon={Wallet}
          tone="teal"
        />
        <ExecutiveKpi
          label="Công việc hoàn thành"
          value={`${summary.data?.completedOrders || 0} công việc`}
          note={`Tỷ lệ hoàn thành ${summary.data?.totalOrders ? Math.round((summary.data.completedOrders / summary.data.totalOrders) * 100) : 0}%`}
          icon={ClipboardCheck}
          tone="blue"
        />
        <ExecutiveKpi
          label="Điểm đánh giá TB hệ thống"
          value={
            summary.data?.averageRating
              ? `${Number(summary.data.averageRating).toFixed(1)} / 5.0`
              : 'Chưa có'
          }
          note="Đánh giá từ khách hàng"
          icon={Star}
          tone="orange"
        />
      </section>
      <section className="executive-main-grid">
        <div className="executive-chart-card">
          <div className="executive-card-head">
            <div>
              <h2>Giá trị đã thu & hoa hồng 6 tháng</h2>
              <p>Giá trị đơn đã thanh toán và hoa hồng đã đối soát theo tháng.</p>
            </div>
            <div className="executive-legend">
              <span>
                <i className="revenue-line" />
                Doanh thu
              </span>
              <span>
                <i className="profit-line" />
                Hoa hồng
              </span>
            </div>
          </div>
          <ExecutiveChart rows={monthData} maximum={maximum} />
        </div>
        <div className="executive-operation-card">
          <h2>Tổng quan vận hành</h2>
          <ExecutiveSignal
            icon={UsersRound}
            label={`${techs.length} Kỹ thuật viên`}
            text={`${activeTechs} thợ sẵn sàng nhận việc`}
            tone="teal"
          />
          <ExecutiveSignal
            icon={TrendingUp}
            label={`${activeTechs} KTV hoạt động tích cực`}
            text="Theo trạng thái sẵn sàng hiện tại"
            tone="blue"
          />
          <ExecutiveSignal
            icon={ShieldCheck}
            label={`Tỷ lệ hoàn thành ${summary.data?.totalOrders ? Math.round((summary.data.completedOrders / summary.data.totalOrders) * 100) : 0}%`}
            text="Dựa trên các chi tiết dịch vụ"
            tone="green"
          />
        </div>
      </section>
      <section className="executive-bottom-grid">
        <div className="executive-table-card">
          <div className="executive-card-head">
            <div>
              <h2>Top 5 kỹ thuật viên theo công việc đã thanh toán</h2>
              <p>Bảng xếp hạng theo công việc hoàn thành và chất lượng dịch vụ</p>
            </div>
            <Link to="/reports?tab=quality" className="text-link">
              Xem toàn bộ KTV <ArrowRight size={15} />
            </Link>
          </div>
          <div className="executive-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Mã KTV</th>
                  <th>Họ và tên</th>
                  <th>Công việc hoàn thành</th>
                  <th>Đánh giá</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {topTechs.length ? (
                  topTechs.map((tech, index) => (
                    <tr key={tech.id}>
                      <td>{index + 1}</td>
                      <td>KTV-{tech.id}</td>
                      <td>
                        <b>{tech.fullName}</b>
                      </td>
                      <td>{tech.completedOrders || 0} công việc</td>
                      <td className="executive-rating">
                        {tech.averageRating ? Number(tech.averageRating).toFixed(2) : '—'}{' '}
                        <Star size={13} />
                      </td>
                      <td>{labels[tech.availability]}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="executive-empty">
                      Chưa có dữ liệu kỹ thuật viên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="executive-policy-card">
          <h2>Chính sách chờ phê duyệt</h2>
          {proposals.loading ? (
            <Loading />
          ) : proposals.data?.length ? (
            proposals.data
              .slice(0, 3)
              .map((p) => <ExecutivePolicy key={p.id} title={p.title} text={p.department} />)
          ) : (
            <Empty
              title="Không có đề xuất mới"
              text="Hiện tại không có chính sách nào cần duyệt."
            />
          )}
        </div>
      </section>
      <div className="executive-actions">
        <Link className="btn" to="/reports">
          <FileText size={17} /> Xuất báo cáo tổng
        </Link>
        <Link className="btn primary" to="/?tab=policies">
          <CheckCircle2 size={17} /> Phê duyệt đề xuất chính sách
        </Link>
      </div>
    </div>
  );
}
function ExecutiveKpi({ label, value, note, icon: Icon, tone }) {
  return (
    <article className={'executive-kpi ' + tone}>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
      <Icon size={20} />
    </article>
  );
}
function ExecutiveSignal({ icon: Icon, label, text, tone }) {
  return (
    <div className={'executive-signal ' + tone}>
      <Icon size={18} />
      <div>
        <b>{label}</b>
        <small>{text}</small>
      </div>
    </div>
  );
}
function ExecutivePolicy({ title, text }) {
  return (
    <article>
      <b>{title}</b>
      <small>{text}</small>
      <Link to="/?tab=policies">
        Xem chi tiết <ArrowRight size={13} />
      </Link>
    </article>
  );
}
function executiveMonths(trend, commissionTrend) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: `T${date.getMonth() + 1}`,
      revenue: 0,
      profit: 0,
    };
  });
  for (const item of trend) {
    const month = String(item.day || '').slice(0, 7),
      target = months.find((entry) => entry.key === month);
    if (target) {
      target.revenue += Number(item.amount || 0);
    }
  }
  for (const item of commissionTrend) {
    const target = months.find((entry) => entry.key === String(item.day || '').slice(0, 7));
    if (target) target.profit += Number(item.amount || 0);
  }
  return months;
}
function ExecutiveChart({ rows, maximum }) {
  const points = (key) =>
    rows.map((row, index) => `${20 + index * 88},${164 - (row[key] / maximum) * 130}`).join(' ');
  return (
    <div className="executive-chart">
      <svg
        viewBox="0 0 480 190"
        preserveAspectRatio="none"
        aria-label="Biểu đồ giá trị đã thu và hoa hồng"
      >
        <path className="chart-grid" d="M20 35H460M20 78H460M20 121H460M20 164H460" />
        <polyline className="chart-revenue" points={points('revenue')} />
        <polyline className="chart-profit" points={points('profit')} />
      </svg>
      <div className="executive-chart-labels">
        {rows.map((row) => (
          <span key={row.key}>{row.label}</span>
        ))}
      </div>
    </div>
  );
}
export function PolicyApproval() {
  const { toast } = useApp(),
    r = useData('/director/policy-proposals', 5000),
    action = useAction();
  const proposals = r.data || [];
  const [selectedId, setSelectedId] = useState(null),
    [note, setNote] = useState(''),
    [effectiveAt, setEffectiveAt] = useState('tomorrow');
  useEffect(() => {
    if (!selectedId && proposals.length > 0) setSelectedId(proposals[0].id);
  }, [proposals, selectedId]);
  const selected = proposals.find((proposal) => proposal.id === selectedId) || proposals[0];
  const decide = async (status) => {
    if (['RevisionRequested', 'Rejected'].includes(status) && !note) {
      action.setError(new Error('Vui lòng nhập ý kiến phê duyệt / chỉ đạo.'));
      return;
    }
    await action.run(async () => {
      await api(`/director/policy-proposals/${selected.id}/decision`, {
        method: 'POST',
        body: {
          decision: status,
          note: note || undefined,
          effectiveAt,
          expectedVersion: selected.version,
        },
      });
      toast(
        status === 'Approved'
          ? `Đã phê duyệt ${selected.proposalCode}.`
          : status === 'RevisionRequested'
            ? `Đã gửi yêu cầu chỉnh sửa ${selected.proposalCode}.`
            : `Đã từ chối ${selected.proposalCode}.`,
      );
      setNote('');
      setSelectedId(null);
      await r.reload();
    }, '');
  };
  return (
    <div className="policy-approval">
      <div className="policy-heading">
        <div>
          <div className="breadcrumb-text">
            HomeFix <span>›</span> Phê duyệt chính sách
          </div>
          <h1>Phê duyệt chính sách & Bảng giá mới</h1>
          <p>Xem xét đề xuất về giá dịch vụ, hoa hồng và thưởng kỹ thuật viên.</p>
        </div>
      </div>
      <ErrorBox error={r.error || action.error} />
      <div className="policy-layout">
        <section className="policy-list">
          <h2>Danh sách đề xuất chờ duyệt</h2>
          {r.loading ? (
            <Loading />
          ) : proposals.length ? (
            proposals.map((proposal) => (
              <button
                type="button"
                key={proposal.id}
                className={proposal.id === selected?.id ? 'selected' : ''}
                onClick={() => {
                  setSelectedId(proposal.id);
                  action.setError(null);
                }}
              >
                <span>Chờ duyệt</span>
                <b>{proposal.title}</b>
                <small>
                  {proposal.department}
                  <em>{date(proposal.submittedAt)}</em>
                </small>
                <i>
                  Đang chọn <ArrowRight size={13} />
                </i>
              </button>
            ))
          ) : (
            <Empty
              title="Không còn đề xuất chờ duyệt"
              text="Các đề xuất mới sẽ xuất hiện tại đây."
            />
          )}
        </section>
        {selected && (
          <section className="policy-detail">
            <div className="policy-detail-head">
              <div>
                <h2>Chi tiết đề xuất {selected.proposalCode}</h2>
                <small>Bảng so sánh giá & chiết khấu</small>
              </div>
              <small>Ngày gửi: {date(selected.submittedAt)}</small>
            </div>
            <div className="policy-compare">
              <div className="policy-compare-head">
                <span>Hạng mục</span>
                <span>Hiện tại</span>
                <span>Đề xuất mới</span>
              </div>
              <div>
                <b>Chiết khấu dịch vụ</b>
                <span>
                  {selected.currentDiscount != null ? selected.currentDiscount + '%' : '—'}
                </span>
                <strong>
                  {selected.proposedDiscount != null ? selected.proposedDiscount + '%' : '—'}
                </strong>
              </div>
              <div>
                <b>Thưởng hiệu suất</b>
                <span>{selected.currentBonus || '—'}</span>
                <strong>{selected.proposedBonus || '—'}</strong>
              </div>
            </div>
            <div className="policy-impact">
              <b>Đánh giá tác động đề xuất</b>
              <p>{selected.impact}</p>
            </div>
            <div className="policy-readonly">
              <b>Ghi chú người đề xuất</b>
              <p>{selected.reason}</p>
            </div>
            <label className="policy-note">
              Ý kiến phê duyệt / Chỉ đạo
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Nhập chỉ đạo hoặc yêu cầu chỉnh sửa chính sách..."
                disabled={action.busy}
              />
            </label>
            <label className="policy-effective">
              Thời gian dự kiến áp dụng
              <select
                value={effectiveAt}
                onChange={(event) => setEffectiveAt(event.target.value)}
                disabled={action.busy}
              >
                <option value="tomorrow">Áp dụng sau 00h00 ngày hôm sau</option>
                <option value="week">Áp dụng từ đầu tuần sau</option>
                <option value="month">Áp dụng từ đầu tháng sau</option>
              </select>
            </label>
            <p>
              Phê duyệt ghi nhận quyết định; quản trị viên cập nhật bảng giá trong danh mục dịch vụ.
            </p>
            <div className="policy-actions">
              <button
                className="btn danger"
                disabled={action.busy}
                onClick={() => decide('Rejected')}
              >
                Từ chối
              </button>
              <button
                className="btn warning"
                disabled={action.busy}
                onClick={() => decide('RevisionRequested')}
              >
                Yêu cầu sửa
              </button>
              <button
                className="btn primary"
                disabled={action.busy}
                onClick={() => decide('Approved')}
              >
                <CheckCircle2 size={17} /> Phê duyệt
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
function StaffHome() {
  const { user } = useApp();
  const summary = useData('/reports/summary', 15000);
  const orders = useData(['DPV', 'CSKH'].includes(user.role) ? '/orders?pageSize=12' : null);
  const users = useData(user.role === 'ADMIN' ? '/users' : null);

  const targets = {
    DPV: ['/orders', 'Mở bàn điều phối'],
    CSKH: ['/support', 'Xử lý yêu cầu hỗ trợ'],
    KT: ['/finance', 'Mở đối soát & ví'],
    ADMIN: ['/admin/users', 'Quản lý tài khoản'],
    GD: ['/reports', 'Xem báo cáo chi tiết'],
  };

  return (
    <>
      <PageHead
        eyebrow="TỔNG QUAN HOẠT ĐỘNG"
        title={`Xin chào, ${user.fullName.split(' ').at(-1)}`}
        text="Dữ liệu cập nhật từ các đơn dịch vụ trong hệ thống."
      >
        <Link className="btn primary" to={targets[user.role]?.[0] || '/orders'}>
          {targets[user.role]?.[1] || 'Xem công việc'} <ArrowRight size={17} />
        </Link>
      </PageHead>

      <ErrorBox error={summary.error} />

      {summary.data && (
        <div className="stat-grid">
          <Stat label="Tổng công việc dịch vụ" value={summary.data.totalOrders} />
          <Stat label="Đã hoàn thành" value={summary.data.completedOrders} icon={ShieldCheck} />
          <Stat label="Giá trị đơn đã thu" value={money(summary.data.gmv)} icon={Wallet} />
          <Stat
            label="Hoa hồng đã đối soát"
            value={money(summary.data.commissionRevenue)}
            icon={Star}
          />
        </div>
      )}

      {user.role === 'ADMIN' ? (
        <div className="two-column">
          <Card title="Tài khoản hệ thống">
            <p>Quản lý tài khoản và quyền truy cập theo bảy vai trò nghiệp vụ.</p>
            <strong className="big-number">{users.data?.length ?? '—'}</strong>
            <p>Tài khoản đang được quản lý</p>
            <Link to="/admin/users" className="btn">
              Xem danh sách <ArrowRight size={16} />
            </Link>
          </Card>
        </div>
      ) : (
        <Card
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Đơn dịch vụ gần đây
              </span>
              {orders.data?.length > 0 && (
                <Link
                  to="/orders"
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--primary, #047857)',
                    textDecoration: 'none',
                  }}
                >
                  Xem tất cả ({orders.data.length}) <ArrowRight size={15} />
                </Link>
              )}
            </div>
          }
        >
          {orders.data?.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
                gap: '14px',
                marginTop: '12px',
              }}
            >
              {orders.data.slice(0, 8).map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <Empty
              title="Mọi thứ sẵn sàng"
              text="Dữ liệu mới xuất hiện khi khách đặt và hoàn tất dịch vụ."
            />
          )}
        </Card>
      )}
    </>
  );
}
export function Services() {
  const s = useData('/services');
  const [group, setGroup] = useState('all'),
    [search, setSearch] = useState('');
  return (
    <>
      <PageHead
        eyebrow="DỊCH VỤ TẠI NHÀ"
        title="Bạn cần HomeFix hỗ trợ gì?"
        text="Chọn dịch vụ phù hợp. Báo giá chính thức sẽ được gửi để bạn xác nhận trước khi phân công thợ."
      />
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <Field label="">
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ (ví dụ: Sửa máy lạnh...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </Field>
      </div>
      <div className="tabs">
        <button className={group === 'all' ? 'active' : ''} onClick={() => setGroup('all')}>
          Tất cả dịch vụ
        </button>
        {Object.entries(groups).map(([key, name]) => (
          <button key={key} className={group === key ? 'active' : ''} onClick={() => setGroup(key)}>
            {name}
          </button>
        ))}
      </div>
      <ErrorBox error={s.error} />
      {s.loading ? (
        <Loading />
      ) : (
        <ServiceCards
          services={(s.data || []).filter(
            (x) =>
              (group === 'all' || x.groupCode === group) &&
              x.name.toLowerCase().includes(search.toLowerCase()),
          )}
        />
      )}
    </>
  );
}
export function Booking() {
  return <MultiServiceBooking />;
}
export function Orders() {
  const { user } = useApp();
  return user.role === 'KH' ? <ServiceOrders /> : <WorkItems />;
}
function WorkItems() {
  const { user } = useApp();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [searchFields, setSearchFields] = useState({ orderId: '', phone: '' });
  const [appliedFilters, setAppliedFilters] = useState({ orderId: '', phone: '', status: '' });
  const debounceRef = useRef(null);

  const queryParams = new URLSearchParams({
    pageSize: '20',
    page: String(page),
  });
  if (appliedFilters.status) queryParams.set('status', appliedFilters.status);
  if (appliedFilters.orderId) queryParams.set('orderId', appliedFilters.orderId);
  if (appliedFilters.phone) queryParams.set('phone', appliedFilters.phone);

  const r = useData('/orders?' + queryParams.toString(), 10000);

  const handleFieldChange = (key, val) => {
    setSearchFields((s) => ({ ...s, [key]: val }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedFilters((f) => ({ ...f, [key]: val.trim() }));
      setPage(1);
    }, 350);
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setAppliedFilters((f) => ({ ...f, status: val }));
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    clearTimeout(debounceRef.current);
    setAppliedFilters({
      orderId: searchFields.orderId.trim(),
      phone: searchFields.phone.trim(),
      status,
    });
    setPage(1);
  };

  const handleReset = () => {
    clearTimeout(debounceRef.current);
    setSearchFields({ orderId: '', phone: '' });
    setStatus('');
    setAppliedFilters({ orderId: '', phone: '', status: '' });
    setPage(1);
  };

  const hasFilter = appliedFilters.orderId || appliedFilters.phone || appliedFilters.status;

  return (
    <>
      <PageHead
        eyebrow={user.role === 'KH' ? 'DỊCH VỤ CỦA BẠN' : 'QUẢN LÝ CÔNG VIỆC'}
        title={user.role === 'KH' ? 'Đơn dịch vụ của tôi' : 'Danh sách đơn dịch vụ'}
        text="Tra cứu và quản lý đơn dịch vụ theo mã đơn, số điện thoại hoặc trạng thái."
      >
        {user.role === 'KH' && (
          <Link className="btn primary" to="/services">
            <Plus size={18} /> Đặt dịch vụ
          </Link>
        )}
        <button className="btn" onClick={r.reload}>
          <RefreshCw size={16} /> Cập nhật
        </button>
      </PageHead>

      <form
        onSubmit={handleSearchSubmit}
        className="card"
        style={{ marginBottom: '16px', padding: '16px 20px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Mã đơn hàng
            </label>
            <input
              type="text"
              placeholder="VD: HF-001012 hoặc 1012"
              value={searchFields.orderId}
              onChange={(e) => handleFieldChange('orderId', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Số điện thoại khách hàng
            </label>
            <input
              type="tel"
              placeholder="VD: 0901... hoặc 0918..."
              value={searchFields.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Trạng thái đơn
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(labels)
                .slice(0, 11)
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="submit" className="btn primary" style={{ flex: 1, whiteSpace: 'nowrap' }}>
              Tìm kiếm
            </button>
            {hasFilter && (
              <button
                type="button"
                className="btn"
                onClick={handleReset}
                style={{ whiteSpace: 'nowrap' }}
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {hasFilter && (
          <div
            style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#047857',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>• Đang lọc:</span>
            {appliedFilters.orderId && (
              <span
                style={{
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0',
                }}
              >
                Mã: {appliedFilters.orderId}
              </span>
            )}
            {appliedFilters.phone && (
              <span
                style={{
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0',
                }}
              >
                SĐT: {appliedFilters.phone}
              </span>
            )}
            {appliedFilters.status && (
              <span
                style={{
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0',
                }}
              >
                Trạng thái: {labels[appliedFilters.status]}
              </span>
            )}
          </div>
        )}
      </form>

      <ErrorBox error={r.error} />

      {r.loading ? (
        <Loading />
      ) : r.data?.length ? (
        <div className="order-list">
          {r.data.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <Empty
          title="Không tìm thấy đơn dịch vụ phù hợp"
          text={
            hasFilter
              ? 'Thử xóa bộ lọc hoặc kiểm tra lại Mã đơn / Số điện thoại.'
              : 'Chưa có đơn dịch vụ nào trong hệ thống.'
          }
        />
      )}

      <div className="pagination">
        <button className="btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Trang trước
        </button>
        <span>Trang {page}</span>
        <button
          className="btn"
          disabled={!r.data || r.data.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Trang sau
        </button>
      </div>
    </>
  );
}
export function Profile() {
  const { user, setUser, logout } = useApp(),
    r = useData('/users/me'),
    a = useAction();
  const [form, setForm] = useState(null),
    [contactPassword, setContactPassword] = useState('');
  useEffect(() => {
    if (r.data)
      setForm({
        fullName: r.data.fullName,
        email: r.data.email || '',
        defaultAddress: r.data.defaultAddress || '',
      });
  }, [r.data]);
  return (
    <>
      <PageHead
        eyebrow="TÀI KHOẢN HOMEFIX"
        title="Thông tin cá nhân"
        text="Giữ thông tin liên hệ chính xác để việc phục vụ được thuận tiện."
      />
      <ErrorBox error={r.error || a.error} />
      {form && (
        <div className="two-column">
          <Card title="Hồ sơ của bạn">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.run(async () => {
                  const result = await api('/users/me', {
                    method: 'PATCH',
                    body: {
                      ...form,
                      email: form.email || null,
                      ...(form.email !== (r.data.email || '')
                        ? { currentPassword: contactPassword }
                        : {}),
                      expectedVersion: r.data.version,
                    },
                  });
                  setUser(result.data);
                  setContactPassword('');
                  r.reload();
                });
              }}
            >
              <div className="profile-heading">
                <span className="avatar large">{user.fullName.slice(0, 1)}</span>
                <div>
                  <h3>{user.fullName}</h3>
                  <span className="badge green">{roleNames[user.role]}</span>
                </div>
              </div>
              <Field label="Họ và tên">
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </Field>
              <Field label="Số điện thoại đăng nhập">
                <input readOnly value={user.phone} />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              {form.email !== (r.data.email || '') && (
                <Field label="Mật khẩu hiện tại để thay đổi email">
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={contactPassword}
                    onChange={(e) => setContactPassword(e.target.value)}
                  />
                </Field>
              )}
              <Field label="Địa chỉ mặc định">
                <textarea
                  value={form.defaultAddress}
                  onChange={(e) => setForm({ ...form, defaultAddress: e.target.value })}
                />
              </Field>
              <Submit busy={a.busy}>Lưu thông tin</Submit>
            </form>
          </Card>
          <div>
            <Card title="Đổi mật khẩu">
              <PasswordChange user={r.data || user} logout={logout} />
            </Card>
            {user.role === 'KH' && (
              <Card title="Trở thành kỹ thuật viên">
                <p>Bạn có kinh nghiệm sửa chữa? Gửi hồ sơ chuyên môn để quản trị viên xét duyệt.</p>
                <Link to="/applications" className="btn">
                  Đăng ký cộng tác
                </Link>
              </Card>
            )}
            <button className="btn danger full" onClick={logout}>
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const BaseProfile = Profile;
Profile = function ProfileWithAvatar() {
  const { user } = useApp(),
    [menu, setMenu] = useState(null),
    [viewing, setViewing] = useState(false),
    [editing, setEditing] = useState(false);
  const openMenu = (event) => {
    const avatar = event.target.closest('.profile-heading .avatar');
    if (!avatar) return;
    const bounds = avatar.getBoundingClientRect();
    setMenu({ top: bounds.bottom + 8, left: bounds.left });
  };
  return (
    <div
      className="profile-avatar-wrapper"
      style={user.avatarUrl ? { '--profile-avatar': `url(${user.avatarUrl})` } : undefined}
      onClick={openMenu}
    >
      <BaseProfile />
      {menu && (
        <AvatarMenu
          position={menu}
          onClose={() => setMenu(null)}
          onView={() => {
            setMenu(null);
            setViewing(true);
          }}
          onEdit={() => {
            setMenu(null);
            setEditing(true);
          }}
        />
      )}
      {viewing && <AvatarViewer onClose={() => setViewing(false)} />}
      {editing && <AvatarDialog onClose={() => setEditing(false)} />}
    </div>
  );
};
function AvatarMenu({ position, onClose, onView, onEdit }) {
  useEffect(() => {
    const close = (event) => {
      if (!event.target.closest('.avatar-actions-menu')) onClose();
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [onClose]);
  return (
    <div className="avatar-actions-menu" style={position}>
      <button type="button" onClick={onView}>
        Xem ảnh đại diện
      </button>
      <button type="button" onClick={onEdit}>
        Chỉnh sửa ảnh đại diện
      </button>
    </div>
  );
}
function AvatarViewer({ onClose }) {
  const { user } = useApp();
  return (
    <div className="avatar-viewer-backdrop" role="presentation" onClick={onClose}>
      {user.avatarUrl ? (
        <img
          className="avatar-viewer-image"
          src={user.avatarUrl}
          alt="Ảnh đại diện"
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <span className="avatar large">{user.fullName.slice(0, 1)}</span>
      )}
    </div>
  );
}
function AvatarDialog({ onClose }) {
  const { user, setUser } = useApp(),
    action = useAction(),
    input = useRef(null);
  const choose = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5242880) {
      action.setError(new Error('Chỉ chọn ảnh JPG hoặc PNG, dung lượng tối đa 5 MB.'));
      return;
    }
    action.run(async () => {
      const uploaded = await upload(file, 'Avatar');
      setUser((current) => ({ ...current, avatarUrl: uploaded.downloadPath }));
      onClose();
    }, 'Đã cập nhật ảnh đại diện.');
  };
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal avatar-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Đổi ảnh đại diện"
      >
        <header>
          <h2>Đổi ảnh đại diện</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </header>
        <div className="avatar-dialog-body">
          {user.avatarUrl ? (
            <img className="avatar-preview" src={user.avatarUrl} alt="Ảnh đại diện hiện tại" />
          ) : (
            <span className="avatar large">{user.fullName.slice(0, 1)}</span>
          )}
          <p>Chọn ảnh JPG hoặc PNG, dung lượng tối đa 5 MB.</p>
          <button
            type="button"
            className="btn primary"
            disabled={action.busy}
            onClick={() => input.current?.click()}
          >
            Chọn ảnh mới
          </button>
          <input ref={input} hidden type="file" accept="image/jpeg,image/png" onChange={choose} />
          <ErrorBox error={action.error} />
        </div>
      </section>
    </div>
  );
}

export function Notifications() {
  const { user } = useApp();
  const r = useData('/notifications', 15000),
    a = useAction();
  return (
    <>
      <PageHead
        eyebrow="CẬP NHẬT MỚI"
        title="Thông báo"
        text="Các thay đổi liên quan đến đơn dịch vụ và tài khoản của bạn."
      />
      <ErrorBox error={r.error || a.error} />
      {r.loading ? (
        <Loading />
      ) : r.data?.length ? (
        <div className="notifications-list">
          {r.data.map((n) => (
            <article className={'notification ' + (!n.readAt ? 'unread' : '')} key={n.id}>
              <div className="notification-icon">
                <Bell size={20} />
              </div>
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <small>{date(n.createdAt)}</small>
                <div className="actions">
                  {notificationPath(n, user.role) && (
                    <Link to={notificationPath(n, user.role)} className="text-link">
                      Mở nội dung <ArrowRight size={14} />
                    </Link>
                  )}
                  {!n.readAt && (
                    <button
                      className="text-btn"
                      disabled={a.busy}
                      onClick={() =>
                        a.run(async () => {
                          await api('/notifications/' + n.id + '/read', {
                            method: 'PATCH',
                            body: {},
                          });
                          r.reload();
                        }, '')
                      }
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Chưa có thông báo mới" />
      )}
    </>
  );
}
