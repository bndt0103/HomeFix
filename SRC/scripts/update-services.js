import { config, dbConfig } from '../backend/src/config.js';
import { sql, q, one, transaction, close } from '../backend/src/db.js';

await transaction(null, async t => {
  try {
    await q('ALTER TABLE dbo.DichVu ADD isPopular bit NOT NULL DEFAULT 0', {}, t);
  } catch (e) {
    // Ignore error if column already exists
  }
  const services = [
    // Điện Nước
    ['Sửa điện tại nhà', 'DienNuoc', 'Khắc phục sự cố chập điện, mất điện, nhảy aptomat.', 50000, 200000, 1],
    ['Sửa điện 3 pha', 'DienNuoc', 'Khắc phục sự cố tủ điện 3 pha, cân pha công nghiệp.', 100000, 500000, 0],
    ['Lắp quạt trần', 'DienNuoc', 'Thi công và lắp ráp các loại quạt trần dân dụng.', 50000, 250000, 1],
    ['Sửa quạt trần', 'DienNuoc', 'Sửa chữa quạt trần không quay, kêu to, hỏng tụ.', 30000, 150000, 0],
    ['Thi công đèn trong nhà', 'DienNuoc', 'Lắp đặt, đi dây và thiết kế hệ thống chiếu sáng.', 50000, 300000, 0],
    ['Sửa ống nước tại nhà', 'DienNuoc', 'Khắc phục các sự cố bục vỡ, rò rỉ đường ống nước.', 50000, 150000, 1],
    ['Sửa máy bơm nước', 'DienNuoc', 'Kiểm tra và sửa chữa máy bơm nước không lên nước, kêu to.', 50000, 250000, 1],
    ['Lắp phao nước tự động', 'DienNuoc', 'Lắp đặt phao điện, phao cơ ngắt nước tự động.', 30000, 150000, 0],
    ['Thông nghẹt bồn rửa chén', 'DienNuoc', 'Xử lý triệt để bồn rửa chén bị tắc nghẽn nước.', 50000, 250000, 1],
    ['Sửa vòi rửa bát', 'DienNuoc', 'Khắc phục vòi rửa bát bị rò rỉ nước, gãy vòi.', 30000, 100000, 0],
    ['Thay vòi hoa sen', 'DienNuoc', 'Lắp mới, thay thế bộ vòi hoa sen nhà tắm.', 30000, 150000, 0],
    ['Sửa bồn cầu', 'DienNuoc', 'Sửa bồn cầu rỉ nước, hỏng phao, nút nhấn không được.', 50000, 200000, 1],
    ['Dò tìm rò rỉ nước ngầm', 'DienNuoc', 'Sử dụng máy siêu âm tìm điểm vỡ ống nước ngầm âm tường/nền.', 100000, 800000, 0],

    // Điện Lạnh
    ['Sửa máy lạnh', 'DienLanh', 'Kiểm tra và sửa máy lạnh không lạnh, chảy nước.', 50000, 300000, 1],
    ['Vệ sinh máy lạnh', 'DienLanh', 'Bảo dưỡng, vệ sinh dàn lạnh và dàn nóng.', 30000, 180000, 1],
    ['Bơm gas máy lạnh', 'DienLanh', 'Kiểm tra và châm thêm gas cho máy lạnh.', 50000, 350000, 0],
    ['Vệ sinh máy lạnh âm trần', 'DienLanh', 'Bảo dưỡng máy lạnh cassette, máy lạnh âm trần ống gió.', 100000, 450000, 0],
    ['Sửa tủ lạnh', 'DienLanh', 'Khắc phục lỗi tủ lạnh không đông đá, hở ron.', 50000, 300000, 1],
    ['Sửa tủ mát, tủ đông', 'DienLanh', 'Bơm gas, thay lốc tủ đông công nghiệp/nhà hàng.', 100000, 500000, 0],

    // Điện Gia Dụng
    ['Sửa máy giặt', 'DienGiaDung', 'Sửa máy giặt mất nguồn, báo lỗi, không vắt.', 50000, 250000, 1],
    ['Vệ sinh máy giặt lồng ngang', 'DienGiaDung', 'Tháo lồng và vệ sinh máy giặt cửa trước.', 50000, 400000, 0],
    ['Vệ sinh máy giặt lồng đứng', 'DienGiaDung', 'Tháo lồng và vệ sinh máy giặt cửa trên.', 50000, 250000, 0],
    ['Sửa lò vi sóng', 'DienGiaDung', 'Sửa lò vi sóng mất nguồn, không nóng.', 50000, 200000, 0],
    ['Sửa máy nước nóng năng lượng mặt trời', 'DienGiaDung', 'Khắc phục rò rỉ, thay ống thủy tinh năng lượng mặt trời.', 100000, 400000, 0],
    ['Sửa máy nước nóng', 'DienGiaDung', 'Sửa máy nước nóng trực tiếp/gián tiếp không nóng.', 50000, 250000, 0],

    // Vệ Sinh & Bảo Trì
    ['Vệ sinh bồn nước inox', 'VeSinh', 'Súc rửa cặn bẩn bồn nước inox trên cao.', 50000, 350000, 0],
    ['Vệ sinh bồn nước ngầm', 'VeSinh', 'Hút cặn và khử khuẩn bể nước ngầm bằng máy.', 100000, 600000, 0],
    ['Vệ sinh sofa tại nhà', 'VeSinh', 'Giặt sofa nỉ, sofa da bằng công nghệ hơi nước.', 50000, 450000, 0],
    ['Rút hầm cầu', 'VeSinh', 'Hút hầm cầu, nạo vét hố ga, xử lý mùi hôi.', 150000, 800000, 0]
  ];

  for(const [name,groupCode,description,inspectionFee,laborFee,isPopular] of services) {
    const existing = await one('SELECT id FROM dbo.DichVu WHERE name=@name', {name}, t);
    if(existing) {
        await q('UPDATE dbo.DichVu SET groupCode=@groupCode,description=@description,inspectionFee=@inspectionFee,laborFee=@laborFee,isPopular=@isPopular WHERE id=@id',
        {id: existing.id, groupCode,description,inspectionFee,laborFee,isPopular}, t);
    } else {
        await q('INSERT dbo.DichVu(name,groupCode,description,inspectionFee,laborFee,commissionRatePercent,isPopular) VALUES(@name,@groupCode,@description,@inspectionFee,@laborFee,15,@isPopular)',
        {name,groupCode,description,inspectionFee,laborFee,isPopular}, t);
    }
  }
  
  // Hide the old generic ones if they are not in the list
  await q('UPDATE dbo.DichVu SET isActive = 0 WHERE name IN (N\'Sửa điện nước\', N\'Vệ sinh thiết bị\')', {}, t);
  
});
await close();
console.log('Done updating services!');
