# Yêu cầu Sửa lỗi và Nâng cấp Hệ thống (Bug Fixes & Enhancements)

Tài liệu này chứa danh sách các lỗi và yêu cầu bổ sung tính năng cho AI Agent thực hiện tự động. Vui lòng đọc kỹ từng mục, phân tích mã nguồn liên quan (Frontend/Backend/Database) và tiến hành sửa đổi.

---

## 1. PHÂN HỆ: BLOG

### Bug 1.1: Sửa tên Menu bài viết
* **Mô tả:** Thay đổi tiêu đề hiển thị trên thanh menu quản trị để người dùng dễ hiểu hơn.
* **Yêu cầu:** Sửa tiêu đề menu hiện tại thành **"Blog"**.

### Bug 1.2: Lỗi Upload hình ảnh trong nội dung bài viết
* **Mô tả hiện tại:** Trình soạn thảo nội dung chưa hỗ trợ upload các định dạng hình ảnh `.webp` và `.svg`. Các định dạng `.png`, `.jpg` đang hoạt động bình thường.
* **Yêu cầu:** * Cấu hình thêm validation và handler để cho phép upload định dạng `.webp` và `.svg` vào nội dung bài viết.
    * Đảm bảo không làm ảnh hưởng đến luồng upload của các định dạng `.png` và `.jpg` hiện tại.

### Bug 1.3: Breadcrumb hiển thị ID thay vì Tên bài viết trong CMS
* **Mô tả hiện tại:** Khi truy cập trang chỉnh sửa bài viết trong CMS, thanh điều hướng (breadcrumb) đang hiển thị ID của bài viết (ví dụ: `Home > Blog > Chỉnh sửa > 123`).
* **Yêu cầu:** Thay thế ID bài viết bằng **Tên bài viết** trên breadcrumb (ví dụ: `Home > Blog > Chỉnh sửa > Hướng dẫn học Python`).

### Bug 1.4: Mất dữ liệu Mini Tag và Plan ID khi quay lại trang chỉnh sửa
* **Mô tả hiện tại:** Sau khi bấm lưu bài viết thành công, nếu người dùng quay lại hoặc tải lại trang chỉnh sửa thì giá trị của trường **Mini Tag** và **Plan ID** bị trống, mặc dù kiểm tra API Network thấy dữ liệu trả về đầy đủ.
* **Yêu cầu:** Kiểm tra luồng binding dữ liệu (data binding/state management) từ API response vào form chỉnh sửa ở Frontend. Đảm bảo hiển thị đúng giá trị của `Mini Tag` và `Plan ID`.

### Bug 1.5: Giao diện Admin - Nút Scroll to Top và Lỗi Double Scrollbar
* **Yêu cầu 1 (Scroll to Top):** Thêm một nút "Scroll to top" (Cuộn lên đầu trang) ở góc dưới giao diện Admin. Nút này chỉ xuất hiện khi người dùng cuộn màn hình xuống quá 1 chiều cao màn hình (viewport height).
* **Yêu cầu 2 (Double Scrollbar):** Hiện tại có một số trang trong giao diện admin xuất hiện 2 thanh cuộn đồng thời (lỗi overflow lồng nhau). Hãy kiểm tra CSS (`overflow`, `height: 100vh`, v.v.) để loại bỏ thanh cuộn thừa, **chỉ giữ lại 1 thanh cuộn duy nhất** cho toàn trang.

### Bug 1.6: Bổ sung các trường SEO và Tự động tạo SEO URL
* **Yêu cầu:** Bổ sung các trường nhập liệu sau vào form danh mục và bài viết:
    * `URL danh mục tin tức` (đối với danh mục)
    * `SEO Title`
    * `SEO Description`
    * `SEO Keywords`
* **Logic xử lý:** Khi người dùng nhập các thông tin SEO này và lưu, hệ thống phải tạo bản ghi SEO đồng bộ, trong đó cấu hình URL chính của bản ghi SEO trùng với URL của chính bài viết/danh mục đó.

### Bug 1.7: Tính năng Bật/Tắt FAQ cho Bài viết Blog
* **Yêu cầu:**
    * Thêm một nút chuyển đổi Bật/Tắt (Button On-Off / Switch) dành cho tính năng FAQ trong trang viết blog.
    * **Logic:** Nếu Trạng thái = **Bật (On)**, hiển thị một danh sách lựa chọn (Dropdown hoặc Multi-select) để người dùng chọn các câu hỏi FAQ từ danh sách FAQ sẵn có trên hệ thống. Nếu Trạng thái = **Tắt (Off)**, ẩn danh sách này và không lưu dữ liệu FAQ cho bài viết đó.

### Bug 1.8: Bổ sung các cột thông tin và Nhãn Cảnh báo trong danh sách quản lý Bài viết
* **Yêu cầu:** Thêm 3 cột mới vào bảng danh sách quản lý bài viết:
    1.  **Ngày đăng** (Publish Date)
    2.  **Ngày sửa** (Modified Date)
    3.  **Cảnh báo** (Status Badge)
* **Logic xử lý cho cột "Cảnh báo":**
    * Nếu bài viết **quá 15 ngày** kể từ Ngày sửa đổi gần nhất mà không có bất kỳ hành động bấm nút chỉnh sửa/lưu nào -> Hiển thị nhãn cảnh báo màu sắc nổi bật: **"Lỗi thời"**.
    * Nếu bài viết mới được tạo hoặc có sự chỉnh sửa trong vòng **15 ngày gần nhất** (tính từ thời điểm hiện tại trở về trước) -> Hiển thị nhãn: **"Mới"**.

---

## 2. PHÂN HỆ: HERO BANNER

### Bug 2.1: Lỗi vỡ giao diện (Text Overflow) trong danh sách quản lý
* **Mô tả hiện tại:** Trong bảng danh sách quản lý Hero Banner, các dòng text nội dung quá dài đang bị đè lên nhau, gây mất thẩm mỹ và lỗi layout.
* **Yêu cầu:** Sử dụng CSS để xử lý chuỗi văn bản dài. Nếu text vượt quá độ rộng của cột, tự động cắt và hiển thị dưới dạng dấu ba chấm (`...`). Thêm thuộc tính `title` hoặc tooltip để xem đầy đủ nội dung khi hover chuột nếu cần.

---

## 3. PHÂN HỆ: FOOTER

### Bug 3.1: Thiếu Đa ngôn ngữ (Localization) cho Title trong Footer
* **Mô tả hiện tại:** Tiêu đề (Title) trong Footer yêu cầu có cấu trúc gồm 2 phần là Tiếng Việt (VI) và Tiếng Anh (EN). Tuy nhiên, hiện tại hệ thống mới chỉ cấu hình và hiển thị được 1 ngôn ngữ.
* **Yêu cầu:** Cấu hình lại schema database/API và form nhập liệu để hỗ trợ cả 2 phần ngôn ngữ (Tiếng Việt và Tiếng Anh) cho tiêu đề Footer. Đảm bảo hiển thị đúng ngôn ngữ tương ứng ở giao diện người dùng bên ngoài theo bộ chuyển đổi ngôn ngữ của trang web.
