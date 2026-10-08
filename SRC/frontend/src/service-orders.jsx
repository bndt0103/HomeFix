import React, { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, upload, uuid } from './api';
import { useApp, useData, useAction, PageHead, Card, Field, ErrorBox, Loading, Submit, Badge, money, date } from './shared';

const orderCode = id => 'DH-' + String(id).padStart(6, '0');
export function MultiServiceBooking() {
    const { serviceId } = useParams(), { user } = useApp(), navigate = useNavigate();
    const services = useData('/services'), action = useAction(), intent = useRef(null), uploads = useRef(new Map());
    const [address, setAddress] = useState(user.defaultAddress || ''), [description, setDescription] = useState(''), [scheduledAt, setSchedule] = useState('');
    const [items, setItems] = useState([{ key: uuid(), serviceId: String(serviceId), description: '', files: [] }]);
    const update = (key, field, value) => setItems(rows => rows.map(row => row.key === key ? { ...row, [field]: value } : row));
    async function submit(event) {
        event.preventDefault();
        await action.run(async () => {
            const lines = [];
            for (const item of items) {
                const attachmentIds = [];
                for (const file of item.files) {
                    if (!uploads.current.has(file)) uploads.current.set(file, (await upload(file, 'OrderFault')).id);
                    attachmentIds.push(uploads.current.get(file));
                }
                lines.push({ serviceId: Number(item.serviceId), description: item.description.trim() || description, attachmentIds });
            }
            const body = { address, description, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, items: lines };
            const sig = JSON.stringify(body);
            if (intent.current?.sig !== sig) intent.current = { sig, key: uuid() };
            const result = await api('/service-orders', { method: 'POST', body, key: intent.current.key });
            navigate(result.data.items.length === 1 ? '/orders/' + result.data.items[0].id : '/service-orders/' + result.data.MaDonHang);
        }, 'Đặt dịch vụ thành công.');
    }
    if (services.loading) return <Loading />;
    return <><PageHead eyebrow="ĐẶT DỊCH VỤ" title="Chọn các dịch vụ cần thực hiện" text="Một đơn có thể gồm nhiều dịch vụ. Mỗi dịch vụ được báo giá, phân công thợ và nghiệm thu riêng." />
        <ErrorBox error={services.error} />
        <form onSubmit={submit} className="two-column booking-layout">
            <Card title="Thông tin đặt lịch">
                <p>{user.fullName} · {user.phone}</p>
                <Field label="Địa chỉ thực hiện"><textarea required minLength={10} maxLength={500} value={address} onChange={e => setAddress(e.target.value)} /></Field>
                <Field label="Thiết bị gặp vấn đề gì?"><textarea required minLength={5} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></Field>
                <Field label="Lịch hẹn (để trống nếu cần sớm nhất)"><input type="datetime-local" step="60" value={scheduledAt} onChange={e => setSchedule(e.target.value)} /></Field>
                {items.map((item, index) => <section className="material-editor" key={item.key}>
                    <div className="row space"><h3>Dịch vụ {index + 1}</h3>{items.length > 1 && <button type="button" className="btn" onClick={() => setItems(rows => rows.filter(row => row.key !== item.key))}>Bỏ dịch vụ {index + 1}</button>}</div>
                    <Field label={`Chọn dịch vụ ${index + 1}`}><select required value={item.serviceId} onChange={e => update(item.key, 'serviceId', e.target.value)}><option value="">Chọn dịch vụ</option>{services.data?.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}</select></Field>
                    {items.length > 1 && <Field label={`Mô tả riêng dịch vụ ${index + 1}`} hint="Để trống để dùng mô tả chung."><textarea minLength={5} maxLength={2000} value={item.description} onChange={e => update(item.key, 'description', e.target.value)} /></Field>}
                    <Field label={`Ảnh tình trạng thiết bị ${index + 1}`}><input type="file" accept="image/jpeg,image/png" multiple onChange={e => {
                        const files = [...e.target.files];
                        if (files.length > 5 || files.some(file => file.size > 5242880)) { action.setError(new Error('Tối đa 5 ảnh mỗi dịch vụ, mỗi ảnh không quá 5 MB.')); e.target.value = ''; return; }
                        update(item.key, 'files', files); action.setError(null);
                    }} /></Field>
                </section>)}
                <button className="btn" type="button" disabled={items.length >= 10} onClick={() => setItems(rows => [...rows, { key: uuid(), serviceId: '', description: '', files: [] }])}>Thêm dịch vụ vào đơn</button>
                <ErrorBox error={action.error} /><div className="form-actions"><Link className="btn" to="/services">Quay lại</Link><Submit busy={action.busy}>Gửi yêu cầu đặt dịch vụ</Submit></div>
            </Card>
            <aside><Card title="Chi phí tham khảo">{items.map(item => { const service = services.data?.find(s => s.id === Number(item.serviceId)); return service ? <div className="money-lines" key={item.key}><h3>{service.name}</h3><div><span>Phí kiểm tra</span><b>{money(service.inspectionFee)}</b></div><div><span>Tiền công</span><b>{money(service.laborFee)}</b></div></div> : null; })}<p>Khách duyệt báo giá từng dịch vụ trước khi phân công. Vật tư được trao đổi trực tiếp với thợ. Chỉ thanh toán sau nghiệm thu.</p></Card></aside>
        </form></>;
}
export function ServiceOrders() {
    const [page, setPage] = useState(1), orders = useData('/service-orders?pageSize=20&page=' + page, 10000);
    return <><PageHead title="Đơn dịch vụ của tôi" text="Theo dõi các công việc và bổ sung dịch vụ trong cùng đơn."><Link className="btn primary" to="/services">Đặt dịch vụ</Link></PageHead>
        <ErrorBox error={orders.error} />{orders.loading ? <Loading /> : orders.data?.length ? orders.data.map(order => <Card key={order.MaDonHang} title={orderCode(order.MaDonHang)}>
            <p>{order.DiaChi}</p><p>{order.items.map(item => item.serviceName).join(' · ')}</p><p>{order.itemCount} dịch vụ · {order.completed} hoàn thành · {order.cancelled} đã hủy</p><Badge value={order.status} /> <Link className="btn" to={'/service-orders/' + order.MaDonHang}>Xem đơn và các dịch vụ</Link>
        </Card>) : <Card title="Chưa có đơn dịch vụ"><p>Chọn dịch vụ để tạo đơn đầu tiên.</p></Card>}
        <div className="pagination"><button className="btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page}</span><button className="btn" disabled={(orders.data?.length || 0) < 20} onClick={() => setPage(page + 1)}>Trang sau</button></div>
    </>;
}
export function ServiceOrderDetail() {
    const { id } = useParams(), order = useData('/service-orders/' + id, 10000), services = useData('/services'), action = useAction(), intent = useRef(null);
    const [serviceId, setService] = useState(''), [description, setDescription] = useState('');
    if (order.loading) return <Loading />;
    if (!order.data) return <ErrorBox error={order.error} />;
    const current = order.data;
    return <><PageHead title={orderCode(current.MaDonHang)} text={current.DiaChi}><Link className="btn" to="/orders">Danh sách đơn</Link></PageHead><ErrorBox error={order.error} />
        <Card title="Tổng hợp đơn"><p>{current.MoTa}</p><p>{current.itemCount} dịch vụ · {current.completed} hoàn thành · {current.cancelled} đã hủy</p><p>Tổng đã nghiệm thu: <b>{money(current.acceptedTotal)}</b> · Đã thanh toán: <b>{money(current.paidTotal)}</b></p><small>Tổng chỉ cộng các phiếu đã nghiệm thu. Thanh toán và phí hủy được xử lý theo từng dịch vụ.</small></Card>
        {current.items.map((item, index) => <Card key={item.id} title={`Dịch vụ ${index + 1}: ${item.serviceName}`}><Badge value={item.status} /><p>{item.description}</p><p>Kỹ thuật viên: {item.technicianName || 'Chưa phân công'}</p><p>Lịch hẹn: {date(item.scheduledAt)}</p><Link className="btn primary" to={'/orders/' + item.id}>Xem báo giá, tiến độ và nghiệm thu</Link></Card>)}
        <Card title="Bổ sung dịch vụ vào đơn"><form onSubmit={event => {
            event.preventDefault(); action.run(async () => {
                const body = { items: [{ serviceId: Number(serviceId), description }] }, sig = JSON.stringify(body);
                if (intent.current?.sig !== sig) intent.current = { sig, key: uuid() };
                await api('/service-orders/' + id + '/items', { method: 'POST', body, key: intent.current.key });
                setService(''); setDescription(''); intent.current = null; order.reload();
            }, 'Đã thêm dịch vụ; điều phối sẽ tiếp nhận riêng công việc mới.');
        }}><Field label="Dịch vụ bổ sung"><select required value={serviceId} onChange={e => setService(e.target.value)}><option value="">Chọn dịch vụ</option>{services.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Mô tả công việc bổ sung"><textarea required minLength={5} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></Field><ErrorBox error={action.error || services.error} /><Submit busy={action.busy}>Thêm dịch vụ</Submit></form></Card>
    </>;
}
