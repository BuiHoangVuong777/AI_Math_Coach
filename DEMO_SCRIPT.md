# Kịch bản Demo — AI Math Coach (Tình huống hình trụ, S1–S6)

> Tài liệu vận hành cho người trình bày demo. Toàn bộ giá trị, nhãn, nút bấm trong tài liệu này được trích trực tiếp từ mã nguồn đang chạy và đã được xác minh bằng kiểm thử tự động + trình duyệt thật (xem Mục 10). Không có giá trị nào bị bịa ra.
>
> Nguồn tham chiếu: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) §9 (tình huống hình trụ), [AGENT.md](AGENT.md) (kiến trúc).
> Cập nhật lần cuối: 26/09/2026.

---

## 1. Tổng quan Demo

**Mục tiêu demo:** Cho khán giả thấy AI Math Coach dẫn một học sinh lớp 9 đi qua trọn vẹn một bài toán — từ đọc đề, quan sát mô hình 3D, dự đoán, thử nghiệm có hướng dẫn, đến tự kiểm chứng độc lập và xem lại bằng chứng học tập — mà không đưa đáp án ngay, và cho thấy AI thật (GPT) hỗ trợ giải thích chứ không tự ý "giải hộ" hay làm sai lệch điểm số.

**Đối tượng khán giả:** phụ huynh, nhà đầu tư/đối tác, hoặc đội ngũ giáo dục đánh giá sản phẩm. Không yêu cầu kiến thức kỹ thuật.

**Giá trị chính cần truyền tải:**
- Học sinh phải tự làm từng bước (không có nút "xem đáp án"); AI chỉ gợi ý tăng dần.
- Mọi phép tính (diện tích, thể tích, hệ số tăng) được **chấm bằng công thức toán xác định**, không phải do AI "đoán" — AI không thể ghi đè kết quả đúng/sai.
- Có bài kiểm chứng độc lập (không gợi ý, không mô hình) để phân biệt "làm được nhờ hỗ trợ" và "tự làm được".
- Có bảng tổng kết bằng chứng học tập cuối phiên, không tuyên bố học sinh đã "thành thạo" hay "ghi nhớ lâu dài" — chỉ báo cáo trung thực những gì quan sát được trong phiên đó.

**Bài toán chính xác của lesson (không được thay đổi khi demo):**
> "Một hình trụ có bán kính r = 2 cm, chiều cao h = 5 cm. Nếu bán kính tăng thành 4 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần?"

Đáp án chuẩn (không hiển thị cho học sinh trước khi họ tự tính): A₁ = 4π cm², A₂ = 16π cm², V₁ = 20π cm³, V₂ = 80π cm³, hệ số tăng = **4 lần**.

Bài kiểm chứng độc lập (S5): "Một hình trụ có bán kính 3 cm, chiều cao 8 cm. Nếu bán kính tăng thành 9 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần? Giải thích." → đáp án **9 lần**.

**Thời lượng khuyến nghị:** 5–7 phút cho toàn bộ S1–S6 (có thể rút gọn S4 bằng cách bỏ bước minh họa sai/gợi ý nếu thời gian gấp — xem ghi chú "có thể bỏ qua" trong Mục 3).

**Phân biệt rõ: phần nào là quy tắc cố định (rule-based/deterministic), phần nào là GPT thật:**

| Phần | Cơ chế | Ghi chú |
|---|---|---|
| S1 chấm phân tích đề, S2 câu hỏi đọc hình, S3 lưu dự đoán | **Quy tắc cố định** | Không gọi AI |
| S4 chấm phép tính (diện tích/thể tích/hệ số), câu hỏi "vì sao", mở khóa giá trị, đồng bộ mô hình 3D | **Quy tắc cố định + toán xác định** | Không gọi AI; xem `src/lib/cylinder/math.ts`, `session.ts` |
| S4 gợi ý tăng dần (nút "Xin gợi ý") | **Nội dung soạn sẵn cố định** | Không gọi AI |
| **S4 khung "Hỏi Coach"** | **GPT thật (OpenAI, model `gpt-4.1-mini` qua Responses API)** khi có `OPENAI_API_KEY`; **tự động chuyển sang trả lời soạn sẵn** khi không có khóa, server lỗi, quá thời gian hoặc câu trả lời không hợp lệ | Đây là phần duy nhất gọi AI thật trong toàn bộ sản phẩm |
| S5 chấm đáp án và lập luận độc lập | **Quy tắc cố định** (đáp án: toán xác định; lập luận: quy tắc từ khóa minh bạch) | Không gọi AI — kể cả khi có khóa GPT |
| S6 tổng kết bằng chứng | **Quy tắc cố định**, tổng hợp từ nhật ký sự kiện đã ghi | Không gọi AI |

**Điều kiện tiên quyết, dịch vụ, biến môi trường:**
- Node.js ≥ 22.18 (đã cài `npm install` một lần).
- Chạy **một lệnh duy nhất**: `npm run dev` — khởi động cả server Coach API (cổng 8787) lẫn web app (Vite, thường ở `http://localhost:5173`, tự tăng cổng nếu bận, ví dụ `:5174`, `:5175`...). Nhìn dòng `Local:` mà Vite in ra để lấy đúng địa chỉ.
- **Không bắt buộc khóa OpenAI để chạy demo.** Nếu không đặt `OPENAI_API_KEY` trong file `.env`, khung "Hỏi Coach" vẫn hoạt động bằng câu trả lời soạn sẵn (nhãn "Coach cơ bản (gợi ý soạn sẵn)"), và toàn bộ hành trình S1–S6 khác không đổi.
- Để bật GPT thật: tạo file `.env` ở thư mục gốc (`cp .env.example .env`) rồi điền `OPENAI_API_KEY=sk-...`. Xem chi tiết Mục 9.

---

## 2. Bảng tra cứu đầu vào Demo

Bảng dưới liệt kê **đúng thứ tự thời gian**, đúng nhãn hiển thị trên giao diện (không phải tên biến trong mã), và giá trị chính xác cần nhập. "Id" trong ngoặc là `id` HTML của ô nhập (hữu ích nếu người trình bày dùng DevTools hoặc script tự động, không cần thiết khi thao tác bằng tay).

| # | Cảnh | Trường trên UI (nguyên văn) | Loại | Giá trị nhập | Đáp án đúng | Nút bấm | Phản hồi kỳ vọng | Bắt buộc |
|---|---|---|---|---|---|---|---|---|
| 1 | S1 | "Bán kính ban đầu r₁ (cm)" (`#an-r1`) | text (decimal) | `2` | — | — | — | Có |
| 2 | S1 | "Bán kính mới r₂ (cm)" (`#an-r2`) — **lần 1 (minh họa hiểu lầm)** | text (decimal) | `8` | 4 | — | "Số này gấp đôi số trong đề. Đề cho bán kính, không phải đường kính — em đọc lại nhé." | Có |
| 3 | S1 | "Chiều cao h (cm)" (`#an-h`) | text (decimal) | `5` | — | — | — | Có |
| 4 | S1 | "Đơn vị độ dài" (`#an-unit`) | select | `cm` | — | — | — | Có |
| 5 | S1 | "Đại lượng giữ nguyên" (`#an-fixed`) | select | `Chiều cao` | — | — | — | Có |
| 6 | S1 | "Đề hỏi gì?" (`#an-target`) | select | `Thể tích mới gấp bao nhiêu lần thể tích cũ (V₂/V₁)` | — | — | — | Có |
| 7 | S1 | — | button | — | — | **"Kiểm tra phân tích"** | Phản hồi lỗi ở dòng 2 (ô r₂), các ô khác báo "Đúng rồi." | Có |
| 8 | S1 | "Bán kính mới r₂ (cm)" — **lần 2 (sửa)** | text | `4` | 4 | — | — | Có |
| 9 | S1 | — | button | — | — | **"Kiểm tra phân tích"** | Tất cả 6 mục "Đúng rồi." → tự chuyển sang S2 | Có |
| 10 | S2 | "Trên hình 'Tham chiếu', đoạn màu cam..." | radio | **"Đường kính = 2 cm"** (sai, minh họa) | "Bán kính r = 2 cm" | — | — | Có |
| 11 | S2 | — | button | — | — | **"Trả lời"** | "Chưa đúng. Đường kính đi qua tâm từ mép này sang mép kia; chiều cao thì vuông góc với đáy. Em nhìn lại đoạn màu cam nhé." | Có |
| 12 | S2 | (radio, chọn lại) | radio | **"Bán kính r = 2 cm"** (đúng) | — | — | — | Có |
| 13 | S2 | — | button | — | — | **"Trả lời"** | Chuyển sang S3 | Có |
| 14 | S3 | — | button | — | — | **"Điền dự đoán minh họa (demo): 2"** | Lưu dự đoán "2", mở khóa S4; *(thay thế cho việc gõ tay vào ô "Thể tích sẽ gấp ... lần" rồi bấm "Gửi dự đoán")* | Có (1 trong 2 cách) |
| 15 | S4 | "Bán kính hình So sánh" (`#comparison-radius`, slider 1–6 cm, bước 0,5) | range | Kéo/đặt đến `4` | — | — | Nhãn "r = 4 cm" trên hình So sánh cập nhật ngay | Có |
| 16 | S4 | — | button | — | — | **"Em đã đặt r = 4 cm và thấy chiều cao vẫn là 5 cm"** | Xác nhận thử nghiệm xong | Có |
| 17 | S4 | — | button | — | — | **"Bắt đầu tính"** | Mở Bước 1 · Diện tích đáy | Có |
| 18 | S4 | "A₁ (r = 2 cm)" (`#calc-area-0`) — **lần 1 (sai, minh họa)** | text | `4π` | 4π | — | — | Có |
| 19 | S4 | "A₂ (r = 4 cm)" (`#calc-area-1`) — **lần 1 (sai)** | text | `8π` | 16π | — | — | Có |
| 20 | S4 | — | button | — | — | **"Kiểm tra phép tính"** | A₁ "Đúng.", A₂ "Có thể em đã nhân bán kính với 2 thay vì bình phương nó. Diện tích dùng r²." | Có |
| 21 | S4 | — | button | — | — | **"Xin gợi ý (0/3)"** | Hiện "Gợi ý 1: Mục tiêu bước này là diện tích hình tròn ở đáy..." | Không — có thể bỏ nếu gấp thời gian |
| 22 | S4 | Ô "Hỏi Coach" (`#coach-area`) | textarea (≤500 ký tự) | `Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2, đúng không ạ?` | — | **"Hỏi Coach"** | Xem Mục 8 — nội dung GPT không cố định | Không — chỉ khi muốn trình diễn GPT |
| 23 | S4 | "A₂ (r = 4 cm)" — **lần 2 (đúng)** | text | `16pi` *(viết liền, không dấu, hệ thống vẫn nhận)* | 16π | — | — | Có |
| 24 | S4 | — | button | — | — | **"Kiểm tra phép tính"** | Cả hai ô "Đúng."; hiện câu hỏi "vì sao" | Có |
| 25 | S4 | "Bán kính gấp 2 lần. Vì sao diện tích đáy lại gấp nhiều hơn 2 lần?" | radio | **"Vì A = πr²: bán kính được bình phương, nên gấp 2 lần thì diện tích gấp 2² = 4 lần."** | (đây là đáp án đúng) | — | — | Có |
| 26 | S4 | — | button | — | — | **"Kiểm tra lý do"** | "Đúng." + thẻ "Làm gì / Vì sao đúng" hiện ra | Có |
| 27 | S4 | — | button | — | — | **"Sang bước tiếp theo"** | Mở Bước 2 · Thể tích | Có |
| 28 | S4 | "V₁ (Tham chiếu)" (`#calc-volume-0`) | text | `20π` | 20π | — | — | Có |
| 29 | S4 | "V₂ (So sánh)" (`#calc-volume-1`) | text | `80π` | 80π | — | — | Có |
| 30 | S4 | — | button | — | — | **"Kiểm tra phép tính"** | Cả hai "Đúng."; hiện câu hỏi "vì sao" | Có |
| 31 | S4 | "Vì sao được tính thể tích bằng V = A · h?" | radio | **"Thể tích hình trụ bằng diện tích đáy nhân chiều cao; hai hình cùng h = 5 cm."** | (đúng) | — | — | Có |
| 32 | S4 | — | button | — | — | **"Kiểm tra lý do"** rồi **"Sang bước tiếp theo"** | Mở Bước 3 · Hệ số tăng | Có |
| 33 | S4 | "V₂ / V₁" (`#calc-ratio-0`) | text | `4` | 4 | — | — | Có |
| 34 | S4 | — | button | — | — | **"Kiểm tra phép tính"** | "Đúng."; hiện câu hỏi "vì sao" | Có |
| 35 | S4 | "Khi chiều cao giữ nguyên, hệ số V₂/V₁ bằng gì?" | radio | **"(r₂/r₁)² — bình phương tỷ số bán kính."** | (đúng) | — | — | Có |
| 36 | S4 | — | button | — | — | **"Kiểm tra lý do"** | So sánh với dự đoán "2" ban đầu; hiện nút cuối | Có |
| 37 | S4 | — | button | — | — | **"Sang bài tự kiểm chứng"** | Chuyển sang S5 | Có |
| 38 | S5 | "Thể tích gấp bao nhiêu lần?" (`#transfer-answer`) | text | `9` | 9 | — | — | Có |
| 39 | S5 | "Giải thích của em" (`#transfer-reason`) | textarea | `Chiều cao giữ nguyên, bán kính gấp 9/3 = 3 nên thể tích gấp 3² = 9 lần` | (đủ bằng chứng) | — | — | Có |
| 40 | S5 | — | button | — | — | **"Gửi bài (không sửa được sau khi gửi)"** | "Đúng: thể tích gấp 9 lần." + "Đủ bằng chứng: lập luận nêu đúng quan hệ cần thiết." | Có |
| 41 | S5 | — | button | — | — | **"Xem tổng kết phiên"** | Chuyển sang S6 | Có |
| 42 | S6 | — | button | — | — | (không cần bấm gì — chỉ xem) | Bảng tổng kết bằng chứng học tập | — |

**Tổng số dòng thao tác trong kịch bản đầy đủ: 42 dòng**, gồm **22 ô nhập/lựa chọn có giá trị cụ thể** (text, select, radio, range, textarea — 21 bắt buộc + 1 tùy chọn là dòng #22 "Hỏi Coach") và **20 nút bấm xác nhận** (trong đó nút "Xin gợi ý" ở dòng #21 cũng tùy chọn).

---

## 3. Kịch bản chi tiết Happy Case (S1 → S6)

Quy ước đọc: **(A)** Mục tiêu cảnh · **(B)** Màn hình/điều khiển ban đầu · **(C)** Hành động theo số thứ tự · **(G)** Giải thích toán học · **(H)** Lời thoại gợi ý cho người trình bày · **(I)** Sự kiện phiên được ghi lại (số `#` là thứ tự bản ghi trong nhật ký bằng chứng — **đúng nếu bạn làm đúng trình tự demo này**; nếu bạn bỏ bớt hoặc thêm bước, số thứ tự sẽ xê dịch tương ứng, điều đó không ảnh hưởng đến kết quả chấm) · **(J)** Thời lượng ước tính · **(K)** Mốc chụp màn hình.

### S1 — Đọc đề (Bước 1 · Hiểu đề)

**(A)** Tách đề thành dữ kiện / ẩn số / điều kiện / yêu cầu, không để lộ lời giải.

**(B)** Mở `http://localhost:5173/coach` (hoặc bấm nút nổi **"AI Math Coach · Thể tích hình trụ"** ở góc dưới-phải trang chủ Vũ trụ Toán học). Bên trái là thẻ đề bài (Đề bài · Lớp 9) với 4 cụm được tô vàng: "bán kính r = 2 cm", "chiều cao h = 5 cm", "bán kính tăng thành 4 cm", "chiều cao giữ nguyên", "tăng gấp bao nhiêu lần". Bên phải là form "Bước 1 · Hiểu đề" với các nhóm: Dữ kiện (3 ô số + 1 select đơn vị), Ẩn số (chỉ hiển thị, không nhập), Điều kiện (1 select), Cần tìm (1 select).

**(C)** Thao tác:
1. Gõ `2` vào ô "Bán kính ban đầu r₁ (cm)".
2. Gõ `8` vào ô "Bán kính mới r₂ (cm)" — **cố ý sai để minh họa** (xem Mục 4).
3. Gõ `5` vào ô "Chiều cao h (cm)".
4. Chọn `cm` ở "Đơn vị độ dài".
5. Chọn `Chiều cao` ở "Đại lượng giữ nguyên".
6. Chọn `Thể tích mới gấp bao nhiêu lần thể tích cũ (V₂/V₁)` ở "Đề hỏi gì?".
7. Bấm **"Kiểm tra phân tích"**.
8. Đọc phản hồi đỏ dưới ô r₂. Sửa lại thành `4`.
9. Bấm **"Kiểm tra phân tích"** lần nữa.

**(G)** Đề cho bán kính (không phải đường kính) là 2 cm và 4 cm; nhầm 8 là hậu quả của việc nhân đôi 4 (hiểu sai đường kính = bán kính × 2, rồi lại nhân đôi lần nữa). Chiều cao 5 cm không đổi xuyên suốt bài — đây là điều kiện quyết định để sau này có `V₂/V₁ = (r₂/r₁)²` thay vì phải tính riêng hai chiều cao khác nhau.

**(H)** *"Trước khi giải bất kỳ bài nào, hệ thống bắt học sinh tách rõ: đề cho gì, cái gì giữ nguyên, và câu hỏi thật sự là gì — chưa cho đụng vào phép tính. Ở đây tôi cố ý gõ sai bán kính mới thành 8 để các bạn thấy hệ thống phát hiện ngay đây là lỗi nhầm bán kính với đường kính, chứ không chỉ báo 'sai' chung chung."*

**(I)** Bản ghi `#1` = `analysis_submitted` (allCorrect: false, r2 → diameter_confusion). Bản ghi `#2` = `analysis_submitted` (allCorrect: true) → chuyển `stage: S1 → S2`.

**(J)** ~45 giây.

**(K)** Chụp màn hình sau bước 9, ngay khi thanh cảnh phía trên chuyển sang tô sáng "S2 · Quan sát".

---

### S2 — Quan sát mô hình (Bước 2 · Quan sát mô hình)

**(A)** Cho học sinh liên hệ ký hiệu (r, h) với vật thể không gian thật, trước khi được phép thao tác thay đổi kích thước.

**(B)** Bên trái xuất hiện khung 3D "Kéo để xoay · cuộn để phóng to · 1 ô lưới = 1 cm" với hai hình trụ: **Tham chiếu** (tím, cố định `r = 2 cm`, `h = 5 cm`) và **So sánh** (xanh lam, hiện cũng `r = 2 cm`, `h = 5 cm`, khóa). Dưới khung 3D có 5 nút điều khiển góc nhìn (biểu tượng, không có chữ — hover để thấy tên). Thanh trượt "Bán kính hình So sánh" hiển thị nhưng **bị khóa** (mờ, không kéo được). Bên phải là câu hỏi đọc hình.

**(C)** Thao tác:
1. Bấm lần lượt các nút góc dưới-phải khung 3D: **"Xoay sang trái"**, **"Xoay sang phải"**, **"Phóng to"**, **"Thu nhỏ"**, **"Đặt lại góc nhìn"** — chỉ để minh họa góc nhìn đổi, số đo không đổi.
2. Thử kéo thanh trượt "Bán kính hình So sánh" → không kéo được (khóa).
3. Chọn đáp án **"Đường kính = 2 cm"** (sai, minh họa) cho câu "đoạn màu cam nối tâm đáy trên với mép đáy là gì?".
4. Bấm **"Trả lời"**.
5. Đọc phản hồi đỏ, chọn lại **"Bán kính r = 2 cm"** (đúng).
6. Bấm **"Trả lời"**.

**(G)** Đoạn màu cam đi từ tâm mặt đáy ra mép đáy — đúng định nghĩa bán kính. Đường kính phải đi xuyên tâm, nối hai mép đối diện (dài gấp đôi bán kính); nhãn `h` (màu vàng) mới là chiều cao, vuông góc với đáy. Việc phân biệt ba đoạn này là điều kiện để hiểu đúng công thức `V = πr²h` ở bước sau.

**(H)** *"Chú ý: xoay hay phóng to ở đây chỉ đổi góc nhìn camera, không đổi kích thước thật — hai hình trụ luôn dùng chung một thang đo 1 ô lưới = 1 cm, để không đánh lừa mắt học sinh. Thanh trượt bán kính vẫn khóa — hệ thống chưa cho thử nghiệm cho đến khi học sinh đưa ra dự đoán ở bước sau."*

**(I)** Bản ghi `#3` = `figure_answered` (choice: diameter, correct: false). Bản ghi `#4` = `figure_answered` (choice: radius, correct: true) → `S2 → S3`.

**(J)** ~40 giây.

**(K)** Chụp màn hình sau bước 1 (khi cả hai hình trụ và nhãn `r = 2 cm` / `h = 5 cm` hiện rõ).

---

### S3 — Dự đoán (Bước 3 · Dự đoán)

**(A)** Buộc học sinh bộc lộ suy nghĩ ban đầu **trước khi** thấy bất kỳ số liệu nào, để sau này đối chiếu.

**(B)** Mô hình 3D và bảng vẫn hiện (chưa đổi), thanh trượt vẫn khóa. Bên phải là câu hỏi "Nếu bán kính tăng gấp đôi (2 cm → 4 cm) và chiều cao giữ nguyên, em đoán thể tích sẽ gấp bao nhiêu lần?" với ô nhập số và hai nút.

**(C)** Thao tác: Bấm nút **"Điền dự đoán minh họa (demo): 2"** (thay vì gõ tay — nút này tự gửi giá trị `2`, gắn nhãn dữ liệu demo).
> *Cách khác (nếu muốn thao tác thủ công):* gõ một số dương bất kỳ vào ô "Thể tích sẽ gấp ... lần" rồi bấm **"Gửi dự đoán"**. Số càng gần `2` càng minh họa rõ hiểu lầm phổ biến "bán kính gấp đôi thì thể tích gấp đôi".

**(G)** Nhiều học sinh trực giác nghĩ thể tích tăng tuyến tính theo bán kính (gấp 2 lần bán kính → gấp 2 lần thể tích). Thực tế thể tích tỷ lệ với **bình phương** bán kính khi chiều cao không đổi — đây chính là điều S4 sẽ giúp học sinh tự phát hiện bằng phép tính, không phải bị bảo trước.

**(H)** *"Dự đoán '2' được lưu nguyên văn, không bị sửa sau này dù đúng hay sai — đây chính là bằng chứng hiểu lầm có thể có mà sản phẩm sẽ dùng ở bảng tổng kết cuối, chứ không dùng để 'chấm điểm' học sinh."*

**(I)** Bản ghi `#5` = `prediction_submitted` (raw: "2", source: demo, verdict: incorrect, misconception: linear_radius_volume/possible) → `S3 → S4`, mở khóa thanh trượt.

**(J)** ~20 giây.

**(K)** Không bắt buộc.

---

### S4 — Thử nghiệm và giải (Bước 4)

**(A)** Học sinh tự kéo thanh trượt để thử nghiệm, rồi tự tính diện tích đáy → thể tích → hệ số tăng, mỗi bước phải giải thích "vì sao" trước khi được mở bước kế; có thể hỏi Coach (AI hoặc bản cố định) khi bí.

**(B)** Thẻ "Thử nghiệm" hiện với nút xác nhận lớn và mục tiêu "Đổi bán kính hình 'So sánh' từ 2 cm thành 4 cm, giữ nguyên chiều cao."

**(C)** Thao tác:
1. Kéo (hoặc gõ giá trị vào) thanh trượt "Bán kính hình So sánh" đến đúng `4`. *(Có thể dừng ở các nấc trung gian như 3 để cho khán giả thấy nhãn "r = 3 cm" và bảng cập nhật ngay lập tức, không cần nút "Áp dụng" — đây là điểm khác biệt so với công cụ hình cầu cũ trong sản phẩm.)*
2. Bấm **"Em đã đặt r = 4 cm và thấy chiều cao vẫn là 5 cm"**.
3. Bấm **"Bắt đầu tính"**.
4. **Bước 1 · Diện tích đáy** — gõ `4π` vào ô "A₁", gõ `8π` vào ô "A₂" (**cố ý sai**, xem Mục 4).
5. Bấm **"Kiểm tra phép tính"**. Đọc phản hồi.
6. (Tùy chọn) Bấm **"Xin gợi ý (0/3)"** để hiện Gợi ý 1.
7. (Tùy chọn — xem Mục 8) Gõ câu hỏi tự do vào khung "Hỏi Coach" và bấm **"Hỏi Coach"**.
8. Sửa ô "A₂" thành `16pi`. Bấm **"Kiểm tra phép tính"** → cả hai đúng.
9. Chọn đáp án lý do đúng: **"Vì A = πr²: bán kính được bình phương, nên gấp 2 lần thì diện tích gấp 2² = 4 lần."** Bấm **"Kiểm tra lý do"**.
10. Bấm **"Sang bước tiếp theo"**.
11. **Bước 2 · Thể tích** — gõ `20π` vào "V₁", `80π` vào "V₂". Bấm **"Kiểm tra phép tính"**.
12. Chọn lý do: **"Thể tích hình trụ bằng diện tích đáy nhân chiều cao; hai hình cùng h = 5 cm."** Bấm **"Kiểm tra lý do"** rồi **"Sang bước tiếp theo"**.
13. **Bước 3 · Hệ số tăng** — gõ `4` vào "V₂ / V₁". Bấm **"Kiểm tra phép tính"**.
14. Chọn lý do: **"(r₂/r₁)² — bình phương tỷ số bán kính."** Bấm **"Kiểm tra lý do"**.
15. Đọc dòng so sánh với dự đoán ban đầu ("2" vs kết quả thật "4 lần").
16. Bấm **"Sang bài tự kiểm chứng"**.

**(G)** Xem chi tiết toán học đầy đủ ở Mục 5.

**(H)** *"Từng ô số ở đây không bao giờ do AI chấm — công thức A = πr² và V = A·h được tính xác định trong mã nguồn. AI chỉ xuất hiện ở khung 'Hỏi Coach' bên dưới, và chỉ để trò chuyện, không có quyền mở khóa hay sửa điểm."*

**(I)** Chuỗi bản ghi (đúng thứ tự nếu làm đủ các bước tùy chọn 6–7): `#6` radius_changed, `#7` experiment_confirmed, `#8` calc_submitted (area, sai), `#9` hint_requested (nếu làm bước 6), `#10` coach_exchange (nếu làm bước 7), `#11` calc_submitted (area, đúng), `#12` reason_submitted (area) + step_completed, `#14` calc_submitted (volume, đúng), `#15` reason_submitted (volume) + step_completed, `#17` calc_submitted (ratio, đúng), `#18` reason_submitted (ratio) + step_completed.

**(J)** ~2–2,5 phút (không tính khung Hỏi Coach); +30–45 giây nếu trình diễn thêm Mục 8.

**(K)** Chụp màn hình ngay sau bước 15 — bảng "Hình / r / h / A = πr² / V = A·h" hiện đủ 4 số `4π, 16π cm² | 20π, 80π cm³` và dòng `V₂/V₁ = 4`.

> **Có thể bỏ qua nếu gấp thời gian:** các thao tác 4–7 (nhập sai, gợi ý, Hỏi Coach) ở Bước 1; có thể nhập thẳng `4π` / `16π` ở bước 4 để rút ngắn ~40 giây, nhưng sẽ mất phần minh họa hiểu lầm cốt lõi của bài học.

---

### S5 — Kiểm chứng độc lập (Bước 5 · Tự kiểm chứng)

**(A)** Đo xem học sinh có tự áp dụng được quy luật "bình phương tỷ số bán kính" sang một bộ số khác, **không có bất kỳ hỗ trợ tức thời nào**.

**(B)** Màn hình chỉ còn: đề bài mới, một ô nhập đáp án, một ô nhập lý do, nút gửi. **Không có mô hình 3D, không có thanh trượt, không có nút gợi ý, không có lại lịch sử bước S4.**

**(C)** Thao tác:
1. Gõ `9` vào ô "Thể tích gấp bao nhiêu lần?".
2. Gõ `Chiều cao giữ nguyên, bán kính gấp 9/3 = 3 nên thể tích gấp 3² = 9 lần` vào ô "Giải thích của em".
3. Bấm **"Gửi bài (không sửa được sau khi gửi)"**.
4. Đọc hai thẻ kết quả: "Đáp án" và "Lập luận" — hiện **riêng biệt**.
5. Bấm **"Xem tổng kết phiên"**.

**(G)** `r₂/r₁ = 9/3 = 3`; vì chiều cao không đổi, `V₂/V₁ = 3² = 9`. Cách khác: `V₁ = π·3²·8 = 72π cm³`, `V₂ = π·9²·8 = 648π cm³`, `648π/72π = 9`. Câu trả lời mẫu ở bước 2 nêu đúng cả hai vế: tỷ số bán kính *và* chiều cao không đổi — đây là điều kiện để được chấm "Đủ bằng chứng".

**(H)** *"Đây là phần quan trọng nhất về mặt sản phẩm: không mô phỏng, không gợi ý, không xem lại được các bước ở S4 — kể cả trong lịch sử hội thoại. Và đáp án đúng không đủ để được ghi là 'hiểu đầy đủ' nếu lý do sai hoặc thiếu — hai điều này luôn được chấm tách biệt."*

**(I)** Bản ghi `#20` = `transfer_submitted` (lưu nguyên văn trước khi chấm). Bản ghi `#21` = `transfer_evaluated` (answerVerdict: correct, reasonVerdict: sufficient) — luôn theo đúng thứ tự lưu trước, chấm sau (không thể đảo ngược).

**(J)** ~35 giây.

**(K)** Chụp màn hình sau bước 4 (hai thẻ "Đáp án" xanh và "Lập luận" xanh cạnh nhau).

---

### S6 — Bằng chứng học tập (Bước 6 · Bằng chứng học tập trong phiên)

**(A)** Trình bày minh bạch: học sinh đã thể hiện gì, dùng bao nhiêu hỗ trợ — không tuyên bố "đã giỏi" hay "sẽ nhớ mãi".

**(B)** Danh sách các dòng bằng chứng, mỗi dòng có số bản ghi tham chiếu `(bản ghi #...)`, tiếp theo là khung cảnh báo màu hổ phách chứa câu giới hạn cố định, một mục "Nhật ký bằng chứng" có thể mở rộng, và nút "Bắt đầu phiên mới".

**(C)** Thao tác: cuộn xem toàn bộ bảng; có thể bấm mở "Nhật ký bằng chứng (22 bản ghi)" để lộ toàn bộ dòng log thô cho khán giả kỹ thuật.

**(G)** Không áp dụng (đây là bước tổng hợp, không có bài toán mới).

**(H)** *"Mỗi dòng ở đây trỏ thẳng về bản ghi gốc — không phải do AI tóm tắt tự do. Nếu một mục không có dữ liệu, hệ thống ghi rõ 'chưa có bằng chứng' thay vì tự suy diễn hay bịa ra câu trả lời của học sinh."* Xem chi tiết đối chiếu ở Mục 7.

**(I)** Đây là cảnh cuối; không sinh sự kiện mới trừ `session_completed` (bản ghi cuối cùng của phiên — `#22` theo đúng kịch bản đầy đủ ở Mục 3, được ghi ngay khi bấm "Xem tổng kết phiên" ở cuối S5). Sự kiện này chỉ hiện trong "Nhật ký bằng chứng" mở rộng, không có dòng riêng trong bảng tóm tắt.

**(J)** ~30 giây.

**(K)** Chụp toàn màn hình — đây là ảnh chốt cho slide "bằng chứng học tập minh bạch".

---

## 4. Minh họa MỘT hiểu lầm (Misconception Demo)

Dùng lại chính xác thao tác đã có trong kịch bản S4 ở trên (không cần rời khỏi luồng chính) — đây là hiểu lầm trọng tâm mà cả bài học được thiết kế để sửa.

| Thành phần | Giá trị chính xác |
|---|---|
| Trường | Ô "A₂ (r = 4 cm)" (`#calc-area-1`), thẻ Bước 1 · Diện tích đáy, cảnh S4 |
| Đầu vào sai | `8π` (kèm `A₁ = 4π` đúng ở ô còn lại) |
| Nút kích hoạt kiểm tra | **"Kiểm tra phép tính"** |
| Phản hồi hệ thống (đúng nguyên văn) | Ô A₁: **"Đúng."** · Ô A₂: **"Có thể em đã nhân bán kính với 2 thay vì bình phương nó. Diện tích dùng r²."** |
| Nút gợi ý | **"Xin gợi ý (0/3)"** → hiện: *"Gợi ý 1: Mục tiêu bước này là diện tích hình tròn ở đáy. Em nhớ công thức diện tích hình tròn theo bán kính không?"* (gợi ý mức 1 **không** tiết lộ đáp án `16π`) |
| Đầu vào đã sửa | `16pi` (hệ thống chấp nhận cả `16π`, `16pi`, `16 pi`, `π·16`...) |
| Kết quả sau khi sửa | Ô A₂ chuyển thành **"Đúng."**; toàn bộ ô Bước 1 hiện đúng → mở câu hỏi "vì sao"; sau khi chọn đúng lý do, bài học tiếp tục bình thường sang Bước 2 |

**Vì sao đây là ví dụ đáng tin cậy để demo:** `8π` khớp chính xác với quy tắc phát hiện lỗi đã lập trình sẵn (`area_linear` trong `src/lib/cylinder/session.ts`) — vì `8 = 2 × 4` (nhân bán kính với 2 thay vì bình phương), nên phản hồi trên **luôn** xuất hiện, không phụ thuộc AI, không có yếu tố ngẫu nhiên.

---

## 5. Demo tương tác 3D ở S4

| Thông số | Giá trị |
|---|---|
| Bán kính ban đầu (cả hai hình) | `r = 2 cm` |
| Bán kính cuối (hình So sánh) | `r = 4 cm` |
| Chiều cao cố định (cả hai hình, suốt S2–S4) | `h = 5 cm` |
| Miền/bước nhảy thanh trượt | 1 cm → 6 cm, bước 0,5 cm (luôn dừng đúng ở 2 và 4) |
| Diện tích đáy | `A₁ = π·2² = 4π cm²` → `A₂ = π·4² = 16π cm²` (gấp `2² = 4` lần) |
| Thể tích | `V₁ = 4π·5 = 20π cm³` → `V₂ = 16π·5 = 80π cm³` |
| Hệ số tăng thể tích | `V₂/V₁ = 80π/20π = 4` (không đơn vị) |

**Thời điểm nên xoay/phóng to và nói gì:**
1. **Ngay khi vào S2** (trước khi được phép đổi bán kính): bấm "Xoay sang trái"/"Xoay sang phải" một vài lần, rồi "Phóng to" để khán giả thấy rõ đoạn màu cam (bán kính) và đoạn màu vàng (chiều cao) trên hình Tham chiếu. Nói: *"Notice cả hai hình đang giống hệt nhau — 2cm bán kính, 5cm cao. Xoay thoải mái, số đo không đổi."*
2. **Ngay sau khi kéo thanh trượt đến `r = 4`** ở S4 (bước C.1 trong kịch bản S4): bấm "Đặt lại góc nhìn" rồi phóng to nhẹ để khán giả thấy rõ hình So sánh giờ "béo" hơn hẳn — đường kính đáy gấp đôi — nhưng **chiều cao hai hình bằng nhau tuyệt đối** (căn thẳng đáy). Nói: *"Đường kính gấp đôi, nhưng chiều cao y hệt — vậy 'to' hơn bao nhiêu lần thì phải tính, không nhìn mắt mà đoán được."*
3. **Sau khi hoàn tất cả 3 bước tính** (cuối kịch bản S4): kéo thử thanh trượt sang `r = 6` một chút để khán giả thấy **toàn bộ bảng số và hệ số `V₂/V₁` cập nhật tức thì** (không cần bấm "Áp dụng") — minh chứng cho tính đồng bộ. Sau đó **nhớ kéo lại về `r = 4`** trước khi bấm "Sang bài tự kiểm chứng" để giữ đúng mạch câu chuyện `4 lần`.

---

## 6. Kiểm chứng độc lập S5

- **Đề bài (nguyên văn):** "Một hình trụ có bán kính 3 cm, chiều cao 8 cm. Nếu bán kính tăng thành 9 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần? Giải thích."
- **Đáp án đúng:** `9` (chấp nhận các cách viết: `9`, `9 lần`, `gấp 9 lần`, `9,0`...).
- **Định dạng đầu vào được chấp nhận cho đáp án số:** số nguyên/thập phân (dấu phẩy hoặc chấm), có thể kèm từ "gấp"/"lần"/"=" — hệ thống tự lọc bỏ các từ đệm này.
- **Câu trả lời lập luận đầy đủ, đã xác minh đạt "Đủ bằng chứng":**
  > `Chiều cao giữ nguyên, bán kính gấp 9/3 = 3 nên thể tích gấp 3² = 9 lần`
  
  (Cách khác cũng đạt "Đủ bằng chứng" — dùng hai thể tích cụ thể: *"V1 = 72π, V2 = 648π, 648π/72π = 9"*.)
- **Hành động gửi bài:** nút **"Gửi bài (không sửa được sau khi gửi)"** — sau khi bấm, cả hai ô bị khóa vĩnh viễn trong phiên, không sửa lại được.
- **Hành vi chấm điểm kỳ vọng:** hai thẻ kết quả tách biệt — "Đáp án" (Đúng/Chưa đúng, luôn kèm phương pháp kiểm chứng bằng công thức, ví dụ `V₂/V₁ = (r₂/r₁)² = (9/3)² = 9; kiểm tra chéo 648π/72π = 9`) và "Lập luận" (Đủ bằng chứng / Một phần / Chưa có bằng chứng) — **không bao giờ gộp thành một điểm số duy nhất**.

**Các tính năng hỗ trợ bị ẩn có chủ đích trong S5 (đã xác minh bằng script — 0 phần tử `<canvas>` trên trang):**
- Không có mô hình 3D.
- Không có thanh trượt bán kính.
- Không có nút "Xin gợi ý".
- Không xem lại được các phép tính/gợi ý đã dùng ở S4, kể cả trong lịch sử hội thoại của Coach.

---

## 7. Bằng chứng và tổng kết S6

Bảng tổng kết đọc trực tiếp từ nhật ký sự kiện (không "tóm tắt tự do" bằng AI). Với kịch bản đầy đủ ở Mục 3 (bao gồm cả gợi ý và Hỏi Coach ở Bước 1), các dòng chính xác sẽ là:

| Dòng | Nội dung ví dụ (đã xác minh trên trình duyệt thật) | Nguồn |
|---|---|---|
| Hiểu đề (S1) | "Xác định đúng dữ kiện sau 2 lần gửi" | bản ghi #1, #2 |
| Dự đoán ban đầu (S3) | "2" — chưa khớp kết quả · dấu hiệu hiểu lầm có thể có: bán kính và thể tích tăng cùng tỷ lệ · (dự đoán minh họa của demo, không phải dữ liệu học sinh thật) | bản ghi #5 |
| Thao tác bán kính (S4) | "Từ 2 cm đến 4 cm sau 1 lần thay đổi; chiều cao giữ 5 cm" | bản ghi #6 |
| Bước diện tích đáy (S4) | "Phép tính: đúng sau 2 lần (lần cuối: 4π; 16pi) · Lý do: đúng sau 1 lần" | bản ghi #8, #11, #12 |
| Bước thể tích (S4) | "Phép tính: đúng sau 1 lần (lần cuối: 20π; 80π) · Lý do: đúng sau 1 lần" | bản ghi #14, #15 |
| Bước hệ số tăng (S4) | "Phép tính: đúng sau 1 lần (lần cuối: 4) · Lý do: đúng sau 1 lần" | bản ghi #17, #18 |
| Gợi ý đã dùng (S4) | "diện tích đáy: mức 1" *(hoặc "Không dùng gợi ý" nếu bỏ qua bước 6 ở S4)* | bản ghi #9 |
| Trao đổi với Coach (S4) | "1 lượt (AI: 1, cơ bản: 0) · dấu hiệu hiểu lầm có thể có: area_linear" *(nếu có dùng khung Hỏi Coach; nếu không dùng: "Không dùng")* | bản ghi #10 |
| Bài độc lập — đáp án (S5) | "\"9\" — đúng (kiểm chứng: gấp 9 lần)" | bản ghi #20, #21 |
| Bài độc lập — lập luận (S5) | "đủ bằng chứng theo quy tắc chấm" | bản ghi #20, #21 |

**Khi thiếu dữ liệu:** bất kỳ dòng nào chưa có bằng chứng (ví dụ nếu người trình bày bỏ qua một cảnh) sẽ hiện chữ in nghiêng **"chưa có bằng chứng"** — hệ thống không bao giờ tự suy diễn hay điền thay câu trả lời cho học sinh (đã kiểm thử tự động, xem Mục 10).

**Câu giới hạn cố định, luôn xuất hiện nguyên văn cuối bảng:**
> "Tóm tắt này chỉ phản ánh bằng chứng quan sát được trong phiên học này. Nó không khẳng định em đã thành thạo hay sẽ ghi nhớ lâu dài."

Người trình bày nên đọc to câu này — đây là điểm khác biệt sản phẩm cố ý nêu rõ với phụ huynh/nhà đầu tư: **không quảng cáo quá mức** kết quả của một phiên duy nhất.

---

## 8. Demo GPT (đã tích hợp thật — OpenAI, model `gpt-4.1-mini`)

**Tình trạng tích hợp:** GPT **đã được tích hợp thật** qua OpenAI Responses API, chỉ hoạt động ở cảnh S4 (từng bước tính), thông qua khung **"Hỏi Coach"** đặt dưới cùng mỗi thẻ bước tính. Không xuất hiện ở bất kỳ cảnh nào khác. Xem hợp đồng kỹ thuật đầy đủ trong `AGENT.md` §4.

**Đầu vào cần nhập để trình diễn (đúng nguyên văn, đã xác minh với GPT thật):**
- Trường: ô "Hỏi Coach" (`#coach-area`, placeholder: *"Ví dụ: Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2, đúng không?"*), khi đang ở Bước 1 · Diện tích đáy, **sau khi đã nộp một lần tính sai** (ví dụ `8π` ở Mục 4) để câu hỏi có ngữ cảnh rõ.
- Nội dung gõ: `Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2, đúng không ạ?`
- Nút: **"Hỏi Coach"**.

**Hành vi sư phạm kỳ vọng (theo prompt hệ thống đã cấu hình trong `server/prompt.ts`):** GPT sẽ (1) nêu khả năng học sinh đang hiểu lầm quan hệ tuyến tính bán kính–diện tích, gắn nhãn "có thể", không khẳng định; (2) **không được phép** nêu con số `16π`, `20π`, `80π` hay "gấp 4 lần" vì Bước 1 chưa được học sinh giải đúng; (3) đặt một câu hỏi Socratic để dẫn dắt học sinh tự tính `r²`; (4) trả lời bằng tiếng Việt phù hợp lứa tuổi, dưới ~90 từ.

**Ví dụ trả lời THẬT đã ghi nhận khi chạy demo này trên môi trường hiện tại (26/09/2026, model `gpt-4.1-mini`) — chỉ mang tính minh họa, GPT sẽ diễn đạt khác đi ở mỗi lần chạy vì bản chất không xác định (non-deterministic):**

> **Nhãn nguồn:** "Coach AI"
> **Cảnh báo hiểu lầm:** "Có thể em đang nhầm: Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2"
> **Nội dung:** "Em đã hiểu rằng bán kính tăng lên, nhưng có thể em đang nghĩ diện tích cũng tăng theo tỷ lệ bán kính, tức là gấp 2. Thực ra, diện tích đáy tính theo công thức A = πr², nên diện tích phụ thuộc vào bình phương bán kính. Em có thể thử tính r² để xem diện tích thay đổi thế nào không?"
> **Câu hỏi dẫn dắt:** "Em hãy thử tính diện tích đáy khi r = 2 và khi r = 4 bằng công thức A = πr² xem sao?"

Trả lời thật này **đã được xác minh** không chứa `16π`, `20π`, `80π` hay "gấp 4 lần" — đúng như ràng buộc kỹ thuật yêu cầu.

**Hành vi dự phòng (fallback) khi KHÔNG có GPT thật:** nếu chưa cấu hình `OPENAI_API_KEY`, server trả lỗi và hoạt động, hoặc GPT trả lời không hợp lệ/rò rỉ đáp án — khung "Hỏi Coach" **tự động** hiện câu trả lời soạn sẵn cố định (không lỗi, không màn hình trắng), với nhãn nguồn đổi thành **"Coach cơ bản (gợi ý soạn sẵn)"**. Với đúng câu hỏi ở trên, câu trả lời cố định sẽ là:
> "Có thể em đã nhân bán kính với 2 thay vì bình phương nó. Diện tích dùng r²." + câu hỏi dẫn dắt "Trong công thức diện tích hình tròn, bán kính xuất hiện mấy lần?"

**Cách trình diễn cả hai trạng thái trong cùng một buổi demo (khuyến nghị cho khán giả kỹ thuật):**
1. Trình diễn với GPT thật đang bật (như Mục 8 trên) — 1 lượt hỏi là đủ.
2. Nếu muốn cho thấy khả năng chịu lỗi: mở một tab terminal riêng, dừng server Coach API (`Ctrl+C` ở tiến trình `dev:server`, hoặc tạm đổi `OPENAI_API_KEY` thành rỗng trong `.env` rồi khởi động lại), gửi lại đúng câu hỏi — nhãn nguồn sẽ đổi ngay thành "Coach cơ bản (gợi ý soạn sẵn)" mà **học sinh không bao giờ bị chặn lại giữa chừng**.

**Ranh giới rõ ràng cần nhấn mạnh với khán giả:** dù trả lời bằng GPT thật, khung Hỏi Coach **không có quyền** mở khóa giá trị (`16π`), không đổi trạng thái Đúng/Sai của phép tính, không chuyển bước — mọi điều đó vẫn do `session.ts` (quy tắc cố định) quyết định. Đây là lý do S6 ghi riêng dòng "Trao đổi với Coach" tách biệt khỏi dòng "Bước diện tích đáy" — hai nguồn bằng chứng khác nhau.

---

## 9. Checklist cho người trình bày

**Chuẩn bị trước buổi demo:**
- [ ] `cd Math-Universe && npm install` (một lần).
- [ ] (Tùy chọn, để có GPT thật) `cp .env.example .env` rồi điền `OPENAI_API_KEY=sk-...` trong `.env`. Không bắt buộc — không có khóa vẫn demo đầy đủ được bằng chế độ "Coach cơ bản".
- [ ] Chạy thử toàn bộ kịch bản một lần trước, để quen thứ tự các nút.
- [ ] Đóng các tab/terminal không liên quan; tắt thông báo hệ thống.

**Lệnh khởi động:**
```bash
npm run dev
```
→ In ra hai dòng log: `[server]` (Coach API — kiểm tra dòng có ghi "AI enabled (model gpt-4.1-mini)" hay "AI DISABLED") và `[web]  ➜  Local: http://localhost:5173/` (hoặc cổng khác nếu 5173 bận — **luôn dùng đúng địa chỉ Vite in ra**).

**Cần khóa API không?** Không bắt buộc. Có khóa → khung "Hỏi Coach" trả lời bằng GPT thật. Không có khóa → tự động dùng câu trả lời soạn sẵn, không có gì bị hỏng hay chặn học sinh.

**URL chính xác để mở:** địa chỉ Vite in ra + `/coach`, ví dụ `http://localhost:5173/coach`. Hoặc mở trang chủ `http://localhost:5173/` rồi bấm nút nổi **"AI Math Coach · Thể tích hình trụ"** ở góc dưới-phải.

**Trình duyệt và khung nhìn khuyến nghị:** Chrome/Edge bản mới (đã dùng WebGL để dựng mô hình 3D). Màn hình rộng ≥ 1280px để thấy bố cục hai cột (mô hình 3D bên trái, hội thoại Coach bên phải) — dưới ngưỡng đó giao diện tự xếp dọc, vẫn dùng được nhưng cần cuộn nhiều hơn khi trình chiếu.

**Trạng thái phiên cần reset trước khi bắt đầu:** phiên chỉ lưu trong bộ nhớ trình duyệt (không có tài khoản, không có cơ sở dữ liệu) — **tải lại trang (F5) trước mỗi lần demo** để chắc chắn bắt đầu từ S1 sạch. Nếu đã lỡ ở giữa phiên cũ, bấm nút **"Làm lại"** (góc trên-phải) → xác nhận hộp thoại → phiên reset về S1 ngay lập tức, không cần tải lại trang.

**Khi demo bị gián đoạn giữa chừng (mất mạng, nhỡ tay bấm sai):**
- Nhỡ bấm sai một lựa chọn: nếu nút "Kiểm tra..." tương ứng *chưa* bấm, cứ sửa lại ô rồi bấm — hệ thống không phạt vì gõ nháp.
- Nếu đã submit sai và muốn quay lại từ đầu: bấm **"Làm lại"** (luôn có ở mọi cảnh, góc trên-phải) rồi bắt đầu lại kịch bản từ S1 — chỉ mất khoảng 3 phút để tới lại điểm cũ theo đúng kịch bản này.
- Nếu khung "Hỏi Coach" không phản hồi/GPT chậm: vẫn có thể tiếp tục ngay các thao tác khác (nhập phép tính, chọn lý do...) — khung Coach không chặn luồng chính. Sau ~15 giây hệ thống tự chuyển sang trả lời cố định nếu GPT không phản hồi kịp.

**Ảnh chụp màn hình nên chuẩn bị sẵn (phòng khi demo trực tiếp gặp sự cố mạng/máy chiếu):**
1. S1 — form phân tích đề đầy đủ, chưa submit.
2. S2 — hai hình trụ 3D với đủ nhãn `r`, `h`.
3. S4 — bảng giá trị đầy đủ 4 số + `V₂/V₁ = 4` sau khi hoàn tất 3 bước.
4. S4 — khung "Hỏi Coach" với nhãn "Coach AI" và một câu trả lời thật.
5. S5 — hai thẻ "Đáp án"/"Lập luận" đều xanh.
6. S6 — bảng tổng kết bằng chứng đầy đủ.

(Bộ ảnh mẫu đúng 6 mốc trên đã được chụp lại trong quá trình xác minh tài liệu này — xem Mục 10.)

---

## 10. Xác minh Demo (đã thực hiện)

Tất cả các bước dưới đây **đã được chạy thật** trên môi trường hiện tại vào 26/09/2026 (Node 22.23, Chrome headless 153 + SwiftShader cho WebGL), không dựa vào suy đoán từ mã nguồn.

| Hạng mục | Cách xác minh | Kết quả |
|---|---|---|
| Bộ kiểm thử tự động (logic + server, không gọi mạng) | `npm test` | **36/36 pass** — bao gồm toàn bộ luật chấm S1–S6, quy tắc phát hiện hiểu lầm, hàng rào chống rò rỉ đáp án của Coach, và hành vi dự phòng khi thiếu khóa/timeout/lỗi mạng |
| Build sản phẩm | `npm run build` | **Thành công** (tsc strict + vite, 3 gói TypeScript kể cả server) |
| **Toàn bộ kịch bản S1 → S6 trong tài liệu này, chạy trên trình duyệt thật** | Script điều khiển Chrome headless qua Chrome DevTools Protocol, chạy đúng trình tự Mục 3, nhắm vào server dev **đang chạy thật** của môi trường (cổng Vite tại thời điểm kiểm thử, Coach API cổng 8787, **có khóa OpenAI thật đã cấu hình**) | **Toàn bộ các bước PASS**, không có lỗi JavaScript nào trên trang. Mọi nhãn, giá trị, phản hồi liệt kê trong Mục 2–7 đều khớp **chính xác từng ký tự** với những gì trình duyệt thật hiển thị |
| **Khung "Hỏi Coach" với GPT thật** (Mục 8) | Gửi đúng 1 tin nhắn thật (`Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2, đúng không ạ?`) tới model `gpt-4.1-mini` qua server đang chạy | **Thành công** — nhãn nguồn trả về đúng "ai" (hiển thị "Coach AI"), nội dung không chứa bất kỳ giá trị đáp án bị khóa nào (`16π`, `20π`, `80π`, "gấp 4"), có nêu khả năng hiểu lầm và đặt câu hỏi dẫn dắt đúng như thiết kế. Nội dung thật được trích nguyên văn ở Mục 8 |
| Số bản ghi trong nhật ký bằng chứng cuối S6 | Đếm trực tiếp trên màn hình sau khi chạy đúng kịch bản đầy đủ (kể cả gợi ý + Hỏi Coach) | **22 bản ghi**, khớp với các số `#` liệt kê ở Mục 3 và 7 |
| Bảng tổng kết S6 không tự suy diễn dữ liệu thiếu | `npm test` (test case FR-EVID-002) | **Pass** — trường thiếu luôn hiện "chưa có bằng chứng" |
| Ảnh chụp màn hình 9 mốc (bao gồm 6 mốc khuyến nghị ở Mục 9) | Chụp tự động trong lúc chạy kịch bản thật | Đã lưu, dùng để đối chiếu nội dung Mục 3–8 khi viết tài liệu này |

**Những gì KHÔNG được xác minh / cần lưu ý:**
- **Nội dung trả lời GPT không xác định (non-deterministic):** ví dụ ở Mục 8 là một lần chạy thật cụ thể; các lần chạy khác (kể cả cùng câu hỏi) sẽ cho từ ngữ khác, tuy hành vi ràng buộc (không lộ đáp án, có câu hỏi dẫn dắt) được đảm bảo bởi hàng rào kiểm tra ở server, không phải bởi việc "GPT luôn nói y hệt".
- **Chưa demo tình huống dừng server/xóa khóa giữa chừng** (Mục 8, phần "cách trình diễn cả hai trạng thái") — hành vi dự phòng được xác minh gián tiếp qua `npm test` (5 test case: thiếu khóa, timeout, lỗi mạng, phản hồi không hợp lệ, phản hồi rò rỉ đáp án — toàn bộ pass) và qua các lần kiểm thử trình duyệt trước đây của cùng codebase không đổi (không có key), nhưng **chưa được chạy lại bằng trình duyệt thật trong đúng phiên xác minh này** vì server thật đang chạy sẵn với khóa hợp lệ.
- **Thiết bị di động, trình đọc màn hình, độ trễ mạng thực tế:** không nằm trong phạm vi tài liệu này.
- Không có lệnh commit/push nào được thực hiện; không sửa `docs/PRODUCT_SPEC.md` hay logic ứng dụng — tài liệu này thuần túy mô tả hành vi đã quan sát được.
