import type { InfobarContent } from '@/components/ui/infobar';

/**
 * What the "Ngày hết hạn" column means (#021).
 *
 * The same column carries two different facts depending on the supplier and on
 * whether the eSIM has been used yet, which is why it needed writing down rather
 * than leaving each admin to guess.
 */
export const esimsInfoContent: InfobarContent = {
  title: 'Ý nghĩa cột "Ngày hết hạn"',
  sections: [
    {
      title: 'eSIM của các nhà cung cấp qua API',
      description:
        'Ngày hết hạn lấy theo thông tin API của nhà cung cấp. Khi eSIM chưa được kích hoạt, đây là HẠN KÍCH HOẠT — thời gian chờ mà nhà cung cấp cho phép (thường 30 / 60 / 90 / 180 ngày). Sau khi khách kích hoạt, ngày hết hạn chuyển thành HẾT HẠN SỬ DỤNG, tính theo chu kỳ của gói: ví dụ gói China 1GB / 7 ngày thì đếm 7 ngày kể từ lúc kích hoạt. Cột này ghi rõ đang là "Hạn kích hoạt" hay "Hết hạn sử dụng" ngay dưới ngày.',
      links: []
    },
    {
      title: 'eSIM Viettel và eSIM nội địa',
      description:
        'Nhóm này không có API để hỏi, nên ngày hết hạn lấy theo file import. Hệ thống bán theo nguyên tắc FEFO — ưu tiên bán eSIM có ngày hết hạn gần nhất trước, để hàng không tồn đến lúc hết hạn.',
      links: []
    },
    {
      title: 'eSIM chưa bán mà đã hết hạn',
      description:
        'Những eSIM này hiện nhãn đỏ "Đã hết hạn — không bán được". Hệ thống KHÔNG giao chúng cho khách nữa, và cũng không tính chúng vào số lượng còn hàng hiển thị ngoài web. Cần nhập hàng mới thay thế, vì phần tồn này coi như mất.',
      links: []
    }
  ]
};
