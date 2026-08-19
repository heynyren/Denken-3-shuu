/**
 * TỪ ĐIỂN GIAO DIỆN — tra bằng chính câu tiếng Việt trong mã.
 *
 * Thiếu một dòng ở đây thì màn hình hiện lại câu tiếng Việt, chứ không hiện ra
 * một cái khoá trần. Xem `chu.ts` để biết vì sao lại tra bằng câu chứ không
 * bằng khoá.
 *
 * Cố ý KHÔNG có trong bảng này:
 *   - Quy chế thi (`data/luat-thi.ts`). Dịch trật một dòng quy chế là người đọc
 *     mất quyền thi, mà nguyên văn tiếng Nhật thì đã nằm sẵn trong dữ liệu —
 *     nên chế độ tiếng Nhật hiện thẳng nguyên văn, xem `views/Rules.tsx`.
 *   - Tên bài, tên chủ đề, đề bài và ghi chú của bạn. Đó là NỘI DUNG, không
 *     phải chữ của giao diện.
 */

export const CHU_BANG: Record<"en" | "ja", Record<string, string>> = {
  en: {
    " · sắp hết giờ!":
      " · almost out of time!",
    " — chốt đáp án và chấm kết quả nhé":
      " — lock in your answers and grade them",
    "+ Thêm ghi chú":
      "+ Add a note",
    "+ Thêm link":
      "+ Add a link",
    ", không làm cả hai.":
      ", not both.",
    ", xong môn này mới sang môn kia:":
      ", finish one subject before moving to the next:",
    "- Cơm nắm ăn giữa 電力 và 機械 (nghỉ 1 tiếng 20)":
      "- Onigiri between 電力 and 機械 (1h20 break)",
    "12 tuần":
      "12 weeks",
    "14 ngày tới":
      "Next 14 days",
    "17 tuần qua":
      "Last 17 weeks",
    ": hai máy cùng ghi một lúc thì bên sau đọc lại rồi gộp lại, không bên nào mất.":
      ": if both machines write at once, the later one reads back and merges — neither side loses anything.",
    "App đã có sẵn đầy đủ":
      "Already bundled with the app",
    "Ba ngày gần nhất":
      "Last three days",
    "Biết trước ngày nào nặng để sắp xếp thời gian.":
      "See which days are heavy so you can plan around them.",
    "Bài làm sai xếp lên trước — đó là thứ cần nhìn lại.":
      "Wrong answers come first — those are the ones worth another look.",
    "Bài sau →":
      "Next question →",
    "Bài đã tự nộp. Mở app xem điểm nhé.":
      "Auto-submitted. Open the app to see your score.",
    "Bàn học sạch":
      "Clean desk",
    "Bạn vẫn thi và bấm giờ bình thường, nhưng phần chấm điểm sẽ để trống. Nạp đáp án bằng":
      "You can still sit the exam and run the clock, but grading will be left blank. Load the answer key with",
    "Bạn đã đánh dấu bài này":
      "You marked this question",
    "Bản cài đặt và dữ liệu nằm ở hai thư mục tách biệt — trình cài đặt chỉ ghi đè phần chương trình, không đụng tới thư mục dữ liệu bên dưới.":
      "The program and your data live in two separate folders — the installer only overwrites the program, it never touches the data folder underneath.",
    "Bản sao lưu hằng ngày nằm cùng máy với bản gốc.":
      "Daily backups sit on the same machine as the original.",
    "Bản sao lưu tự động":
      "Automatic backup",
    "Bấm":
      "Press",
    "Bật đồng bộ":
      "Turn on sync",
    "Bắt đầu":
      "Start",
    "Bắt đầu lại":
      "Start over",
    "Bắt đầu thi →":
      "Start the exam →",
    "Bắt đầu tính giờ":
      "Start the clock",
    "Bắt đầu ôn →":
      "Start reviewing →",
    "Bỏ chọn hết":
      "Clear all",
    "Bỏ lọc":
      "Clear filters",
    "Bỏ lọc sao":
      "Clear star filter",
    "Bỏ những bài đã xử lý xong khỏi danh sách rồi dựng lại từ đầu":
      "Drop the questions you have finished and rebuild the list",
    "Bỏ đánh dấu bài này":
      "Unmark this question",
    "Bỏ đồng hồ":
      "Drop the clock",
    "Bốn môn":
      "Four subjects",
    "Bốn môn trong một ngày":
      "Four subjects in one day",
    "Bốn môn trọn vẹn":
      "All four subjects covered",
    "Chu kỳ ôn tập":
      "Review cycle",
    "Chuyển dữ liệu từ file Excel":
      "Import data from an Excel file",
    "Chuỗi ngày":
      "Streak",
    "Chuỗi ngày liên tiếp đạt mục tiêu":
      "Days in a row hitting your goal",
    "Chào buổi chiều":
      "Good afternoon",
    "Chào buổi sáng":
      "Good morning",
    "Chào buổi trưa":
      "Good day",
    "Chào buổi tối":
      "Good evening",
    "Chào mừng bạn đến với sổ ôn thi":
      "Welcome to your study notebook",
    "Chép cả file đính kèm. File đính kèm chỉ chép một lần vì tên không đổi, nên mỗi lần ghi chỉ tốn vài trăm KB của data.json.":
      "Attachments are copied too. Each file is copied only once because its name never changes, so every save costs only a few hundred KB of data.json.",
    "Chưa chấm bài nào trong ba ngày qua. Làm vài bài là hiện ngay ở đây.":
      "Nothing graded in the last three days. Do a few questions and they show up here.",
    "Chưa chấm được":
      "Cannot be graded",
    "Chưa có dữ liệu. Ôn vài bài là biểu đồ hiện lên ngay.":
      "No data yet. Review a few questions and the chart appears.",
    "Chưa có ghi chú nào. Bấm “Thêm ghi chú” để viết cách giải hoặc chỗ hay nhầm.":
      "No notes yet. Tap “Add a note” to write down how you solved it, or where you keep slipping.",
    "Chưa có huy hiệu nào — cứ học đều, tự khắc mở khoá.":
      "No badges yet — keep at it and they unlock on their own.",
    "Chưa có link nào. Dán link Gemini, YouTube, blog… mà bạn dùng cho bài này.":
      "No links yet. Paste the Gemini, YouTube or blog links you use for this question.",
    "Chưa làm":
      "Not started",
    "Chưa đánh dấu bài nào":
      "No questions marked",
    "Chạy ngầm mỗi lần mở app":
      "Runs in the background every time the app opens",
    "Chỉ dùng một lần, cho ai trước đây theo dõi tiến độ bằng file Excel “Bài tập điện hạng 3”. Ghi đè tiến độ hiện có của các bài trùng.":
      "One-time use, for anyone who used to track progress in the “Bài tập điện hạng 3” spreadsheet. Overwrites current progress for questions that match.",
    "Chọn cả 4 môn":
      "Pick all 4 subjects",
    "Chọn kỳ thi":
      "Pick an exam session",
    "Chọn môn thi":
      "Pick subjects",
    "Chọn một thư mục trong Google Drive hoặc OneDrive ở dưới, app sẽ tự chép sang đó sau mỗi lần ghi.":
      "Pick a folder inside Google Drive or OneDrive below, and the app copies your data there after every save.",
    "Chọn một trong hai câu cuối.":
      "Answer one of the last two questions.",
    "Chọn thư mục…":
      "Choose a folder…",
    "Chốt đáp án rồi chấm đúng/sai nhé.":
      "Lock in your answers, then mark them right or wrong.",
    "Chủ đề này chưa có bài nào":
      "No questions in this topic yet",
    "Cài đặt":
      "Settings",
    "Cách giải, chỗ hay nhầm, công thức cần nhớ… (dán ảnh chụp màn hình thẳng vào đây được)":
      "How you solved it, where you slip, formulas to remember… (you can paste a screenshot straight in here)",
    "Còn lại tới kỳ thi":
      "Left until the exam",
    "Có file đính kèm":
      "Has attachments",
    "Có mặt trong phòng trước giờ bắt đầu 20 phút. Quá 30 phút sau giờ bắt đầu là hết quyền vào.":
      "Be in the room 20 minutes before the start. More than 30 minutes late and you lose the right to enter.",
    "Có thể tên chủ đề đã đổi ở bản danh mục mới. Thử tìm trong Danh sách bài.":
      "The topic may have been renamed in the newer catalogue. Try searching in the question list.",
    "Cần":
      "Needs",
    "Cập nhật app không làm mất dữ liệu.":
      "Updating the app does not lose your data.",
    "Cờ Việt Nam":
      "Flag of Vietnam",
    "Của riêng bạn":
      "Yours alone",
    "Cựu sinh viên khoa":
      "Alumnus of",
    "Cựu sinh viên khoa Tự động hoá, Đại học Bách Khoa Hà Nội. Làm công cụ này để việc ôn":
      "Alumnus of Automation Engineering, Hanoi University of Science and Technology. Built this tool to make studying",
    "Danh sách bài":
      "Question list",
    "Dừng ở đây, xem điểm":
      "Stop here, show my score",
    "Dữ liệu của bạn":
      "Your data",
    "Dựng lại danh sách":
      "Rebuild the list",
    "File JSON không mang theo ảnh đính kèm — ảnh ở máy nào vẫn nằm ở máy đó.":
      "A JSON file carries no attachments — images stay on the machine that holds them.",
    "Ga nào xuống, mấy giờ ra khỏi nhà, mang theo gì. Đồng bộ sang điện thoại như mọi ghi chú khác.":
      "Which station, what time to leave home, what to bring. Syncs to your phone like any other note.",
    "Ghi chú cho hôm thi":
      "Notes for exam day",
    "Ghi nhận làm sai":
      "Mark as wrong",
    "Ghi nhận làm đúng":
      "Mark as right",
    "Ghi theo kiểu nguyên tử: ghi ra file tạm rồi mới đổi tên đè lên, mất điện giữa chừng cũng không làm hỏng dữ liệu.":
      "Written atomically: the app writes a temp file and renames it over the original, so a power cut mid-write cannot corrupt your data.",
    "Giấu token":
      "Hide token",
    "Giờ thi từng môn":
      "Start times by subject",
    "Gặp bài hay hoặc bài dễ nhầm thì bấm ngôi sao ở góc thẻ bài. Sát ngày thi, đây là danh sách đáng lật lại nhất.":
      "When a question is good, or easy to trip on, tap the star in the corner of its card. Close to exam day this is the list most worth revisiting.",
    "Gộp chứ không ghi đè.":
      "Merges, never overwrites.",
    "Gộp hai bên bằng một file, không bên nào mất dữ liệu":
      "Merge both sides through one file, neither loses data",
    "Gộp từ file":
      "Merge from a file",
    "Gộp từ file của máy kia":
      "Merge from the other machine's file",
    "Gỡ file này":
      "Remove this file",
    "Gửi file đó sang máy kia — Drive, Zalo, Telegram, dây USB, kiểu gì cũng được.":
      "Send that file to the other machine — Drive, Zalo, Telegram, a USB cable, whatever works.",
    "Hoãn 1 ngày":
      "Postpone 1 day",
    "Hoãn 1 tuần":
      "Postpone 1 week",
    "Huy hiệu đã đạt":
      "Badges earned",
    "Huy hiệu được giữ kín cho tới lúc bạn chạm mốc. Đang học mà đạt được thì app sẽ báo ngay.":
      "Badges stay hidden until you reach the mark. Hit one mid-session and the app tells you right away.",
    "Hôm nay":
      "Today",
    "Hôm nay chưa làm bài nào. Mở màn thôi!":
      "Nothing done today yet. Let's open one!",
    "Hết giờ làm bài":
      "Time is up",
    "Hết giờ rồi!":
      "Time is up!",
    "Học bài đầu tiên →":
      "Study your first question →",
    "Học hôm nay để giữ chuỗi":
      "Study today to keep the streak",
    "Khuya rồi, cố lên":
      "Late night — keep going",
    "Khôi phục sau sự cố":
      "Recover after a mishap",
    "Khôi phục từ bản sao lưu":
      "Restore from a backup",
    "Không còn bài chưa làm ở cả bốn môn":
      "No untouched questions left in any of the four subjects",
    "Không còn bài nào chưa làm khớp bộ lọc. Quay lại ôn theo lịch nhé.":
      "No untouched questions match the filter. Back to the scheduled review.",
    "Không còn bài nào đang sai":
      "No questions currently wrong",
    "Không còn bài nào đến hạn":
      "Nothing due",
    "Không có bài nào khớp":
      "No questions match",
    "Không có bài nào khớp bộ lọc. Thử bỏ bớt điều kiện xem sao.":
      "No questions match the filter. Try dropping a condition.",
    "Không có bài sai nào khớp bộ lọc.":
      "No wrong questions match the filter.",
    "Không khôi phục được.":
      "Could not restore.",
    "Không làm câu này":
      "Skip this question",
    "Không lưu được ảnh dán vào.":
      "Could not save the pasted image.",
    "Không lưu, thi lại":
      "Discard and retake",
    "Không nhập được.":
      "Could not import.",
    "Không đọc được file.":
      "Could not read the file.",
    "Kiểm tra kết nối":
      "Check the connection",
    "Link bài tập đi kèm app, còn ghi chú và link tham khảo là của riêng bạn — cập nhật app không làm mất phần này.":
      "Practice links ship with the app; notes and reference links are yours alone — updating the app never touches them.",
    "Luật thi":
      "Exam rules",
    "Làm nguyên một kỳ thi thật, có bấm giờ và chấm điểm":
      "Sit a full exam, on the clock and graded",
    "Làm đúng thì bài lên một cấp và hẹn ôn lại xa hơn. Làm sai thì về cấp 1, mai ôn lại. Đây đúng là chu kỳ trong file Excel gốc của bạn.":
      "Get it right and the question moves up a level with a longer gap. Get it wrong and it drops to level 1, back tomorrow. This is exactly the cycle from your original spreadsheet.",
    "Lý thuyết":
      "Theory",
    "Lưu ghi chú":
      "Save note",
    "Lưu kết quả và quay lại":
      "Save the result and go back",
    "Lượt thi này được lưu bằng bản app cũ nên chỉ có điểm, không có bài làm từng câu. Những lượt thi từ giờ trở đi đều có bảng phân tích đầy đủ.":
      "This attempt was saved by an older version of the app, so it only has the score, not the per-question answers. Every attempt from now on gets the full analysis.",
    "Lấy lại toàn bộ dữ liệu từ một bản sao lưu. Thay thế tiến độ hiện tại.":
      "Pull all your data back from a backup. Replaces current progress.",
    "Lịch sử thi thử":
      "Mock exam history",
    "Lịch ôn sắp tới":
      "Upcoming reviews",
    "Lỗi khi lưu":
      "Save failed",
    "Muốn chắc ăn hơn nữa thì thỉnh thoảng bấm “Xuất bản sao lưu” rồi cất lên Google Drive.":
      "To be extra safe, hit “Export a backup” now and then and keep it on Google Drive.",
    "Muốn hai bên giống hệt nhau thì làm ngược lại một lượt nữa.":
      "To make both sides identical, do the same in the other direction once more.",
    "Máy tính và điện thoại cùng đọc ghi một file trong repo riêng tư của bạn":
      "Desktop and phone read and write one file in your own private repo",
    "Máy đang có dữ liệu mới hơn: bấm":
      "This machine has newer data: press",
    "Máy điện":
      "Machines",
    "Mất quyền thi":
      "Disqualified",
    "Mỗi môn có đồng hồ riêng,":
      "Each subject has its own clock,",
    "Mỗi ngày mở app giữ lại một bản, quá số này thì bản cũ nhất bị xoá.":
      "One copy kept each day you open the app; past this count the oldest is deleted.",
    "Một ngày được tính vào chuỗi khi số bài ôn đạt mức này.":
      "A day counts toward the streak once you review this many questions.",
    "MỚI":
      "NEW",
    "Mới có đáp án cho":
      "Answer key so far for",
    "Mở bài trên denken-ou.com":
      "Open the question on denken-ou.com",
    "Mở lời giải trên denken-ou.com":
      "Open the solution on denken-ou.com",
    "Mở thư mục dữ liệu":
      "Open the data folder",
    "Mở đề bài trên denken-ou.com":
      "Open the question text on denken-ou.com",
    "Mục tiêu học":
      "Study goal",
    "Mục tiêu mỗi ngày (số bài)":
      "Daily goal (questions)",
    "Nghỉ một chút rồi thi tiếp. Môn sau có đồng hồ riêng, bấm nút mới bắt đầu tính giờ — thời gian nghỉ không bị trừ vào bài.":
      "Take a short break before the next subject. It has its own clock and only starts when you press the button — your break is not taken out of the exam time.",
    "Nguồn":
      "Source",
    "Ngày thi":
      "Exam date",
    "Nhiều":
      "Many",
    "Nhân bản không thành công.":
      "Mirroring failed.",
    "Nhân bản ngay":
      "Mirror now",
    "Nhập từ file Excel":
      "Import from an Excel file",
    "Nhập vào đây":
      "Type it in here",
    "Nhịp học":
      "Study rhythm",
    "Nhớ lâu":
      "Long-term memory",
    "Những bài bạn tự đánh dấu là đáng chú ý":
      "Questions you marked as worth another look",
    "Ninh Bình, Việt Nam":
      "Ninh Binh, Vietnam",
    "Nyren Phạm":
      "Nyren Phạm",
    "Nơi cất và cách sao lưu":
      "Where it lives and how it is backed up",
    "Nếu file chính hỏng, app tự lấy bản sao lưu mới nhất còn đọc được và cất file hỏng sang thư mục":
      "If the main file is damaged, the app falls back to the newest readable backup and moves the broken file into",
    "Nộp":
      "Submit",
    "Nộp bài và xem điểm":
      "Submit and see the score",
    "Nộp môn này":
      "Submit this subject",
    "Nộp rồi là không quay lại sửa được, giống phòng thi thật.":
      "Once submitted you cannot go back and change it, just like the real exam room.",
    "Phiên bản app":
      "App version",
    "Pháp quy":
      "Regulations",
    "Phím tắt:":
      "Shortcuts:",
    "Phím ←":
      "← key",
    "Phím →":
      "→ key",
    "Phần trên chép từ tờ 受験票 và tờ hướng dẫn kèm theo. Quy chế có thể đổi theo từng kỳ — sát ngày thi nên mở trang chính thức xem lại một lượt.":
      "The above is copied from the 受験票 and the guidance sheet that comes with it. Rules can change from session to session — close to exam day, open the official page and read it through once.",
    "Repo riêng tư (tài-khoản/tên-repo)":
      "Private repo (account/repo-name)",
    "Sao lưu ra ngoài máy tính":
      "Back up off this computer",
    "Sao lưu tự động trên máy":
      "Automatic backup on this machine",
    "Sơ đồ hội trường, tra kết quả, và bản quy chế đầy đủ đều ở đây.":
      "Hall layout, results lookup, and the full regulations are all there.",
    "Số bài có tiến độ":
      "Questions with progress",
    "Số bài đã ôn hôm nay trên mục tiêu":
      "Questions reviewed today against the goal",
    "Số bản sao lưu giữ lại":
      "Backups to keep",
    "Số lượt ôn mỗi tuần":
      "Reviews per week",
    "Sổ ôn thi":
      "Study notebook",
    "Thao tác không thành công.":
      "That did not work.",
    "Thi thử":
      "Mock exam",
    "Thoát":
      "Exit",
    "Thoát chế độ chủ đề":
      "Leave topic mode",
    "Thành tích":
      "Achievements",
    "Thư mục dữ liệu":
      "Data folder",
    "Thư mục nhân bản":
      "Mirror folder",
    "Thứ duy nhất cứu được bạn khi ổ cứng hỏng hoặc mất máy":
      "The only thing that saves you when the drive dies or the machine is lost",
    "Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.":
      "Try removing a filter or changing the search words.",
    "Tiến độ từng môn":
      "Progress by subject",
    "Tiếp tục":
      "Continue",
    "Token nằm riêng,":
      "The token is kept apart,",
    "Top 5 mỗi môn":
      "Top 5 per subject",
    "Trang chính thức của trung tâm khảo thí":
      "Official site of the examination centre",
    "Tuyệt vời, học tiếp thôi!":
      "Nice — keep going!",
    "Tên gợi nhớ":
      "A name you will recognise",
    "Tìm theo tên bài, chủ đề, kỳ thi, hoặc trong ghi chú…":
      "Search by question name, topic, exam session, or inside your notes…",
    "Tính gộp cả lượt ôn tập lẫn từng ý trong đề thi thử. Bấm một chủ đề để ôn lại cả chủ đề đó.":
      "Counts both review rounds and each part of a mock exam. Tap a topic to review the whole thing.",
    "Tạm dừng":
      "Pause",
    "Tạo một repo":
      "Create a repo",
    "Tất cả môn":
      "All subjects",
    "Tắt":
      "Off",
    "Tắt chuông":
      "Silence the alarm",
    "Tắt đồng bộ":
      "Turn off sync",
    "Tổng tiến độ":
      "Overall progress",
    "Từng câu":
      "Per question",
    "Từng câu — bạn chọn gì, đáp án đúng là gì":
      "Per question — what you chose, what was correct",
    "Tự chạy lúc mở app, lúc quay lại app, và mỗi 5 phút. Vẫn là":
      "Runs when the app opens, when you come back to it, and every 5 minutes. Still",
    "Tự động hoá, Đại học Bách Khoa Hà Nội":
      "Automation Engineering, Hanoi University of Science and Technology",
    "Về tác giả":
      "About the author",
    "Xem thêm":
      "Show more",
    "Xin cảm ơn mọi người đã đọc.":
      "Thank you all for reading.",
    "Xong mục tiêu hôm nay rồi. Nghỉ ngơi thôi!":
      "Today's goal is done. Time for a break!",
    "Xoá ghi chú này":
      "Delete this note",
    "Xoá link này":
      "Delete this link",
    "Xoá lần thi này":
      "Delete this attempt",
    "Xoá trạng thái và lịch ôn, giữ nguyên ghi chú và link tham khảo":
      "Clear the status and review schedule, keep notes and reference links",
    "Xuất bản sao lưu (JSON)":
      "Export a backup (JSON)",
    "Xuất file để mang sang":
      "Export a file to carry over",
    "Xuất ra Excel":
      "Export to Excel",
    "Xuất toàn bộ (.zip)":
      "Export everything (.zip)",
    "chuyển bài. Chấm xong app không tự nhảy bài — bạn tự chuyển khi đã ghi chú xong.":
      "to change question. The app does not jump on its own after grading — you move on when your notes are done.",
    "chưa có đáp án":
      "no answer key yet",
    "chưa lần nào":
      "never yet",
    "còn lại trong giáo trình":
      "left in the syllabus",
    "cần quay lại xử lý":
      "need another pass",
    "gộp chứ không ghi đè":
      "merges, never overwrites",
    "hai bên đã giống nhau":
      "both sides already match",
    "hoặc":
      "or",
    "hôm nay":
      "today",
    "không":
      "not",
    "không cộng dồn thời gian":
      "time does not carry over",
    "lần lượt từng môn":
      "one subject at a time",
    "mất file":
      "file missing",
    "một cách khoa học và đỡ vất vả.":
      "more methodical and less of a slog.",
    "ngày":
      "days",
    "ngày liên tiếp đạt mục tiêu":
      "days in a row hitting the goal",
    "ngày tới kỳ thi":
      "days until the exam",
    "nằm trong data.json — nên file bạn xuất ra hay chép sang Drive không mang theo nó.":
      "lives in data.json — so the file you export or copy to Drive does not carry it.",
    "riêng cho dữ liệu, đừng dùng chung repo mã nguồn.":
      "just for data — do not reuse the source-code repo.",
    "rồi chọn file vừa nhận.":
      "then pick the file you just received.",
    "sẽ ai cũng đọc được. Chuyển sang Private đi đã.":
      "would be readable by anyone. Switch it to Private first.",
    "sửa sau cùng":
      "last edited",
    "trống và Private":
      "empty and Private",
    "tính theo ý — B問題 mỗi câu 2 ý":
      "counted per part — each B問題 has 2 parts",
    "Ít":
      "Few",
    "Ô càng sáng là ngày đó học càng nhiều.":
      "The brighter the cell, the more you studied that day.",
    "Ôn hết bài đến hạn, không còn bài nào quá hạn":
      "Everything due reviewed, nothing overdue",
    "Ôn lại toàn bộ chủ đề này":
      "Review this whole topic",
    "Ôn lại →":
      "Review again →",
    "Ôn tập":
      "Review",
    "Đang chờ lưu…":
      "Waiting to save…",
    "Đang kiểm tra…":
      "Checking…",
    "Đang lưu…":
      "Saving…",
    "Đang mở sổ ôn thi…":
      "Opening your notebook…",
    "Đang sai":
      "Currently wrong",
    "Đang thêm…":
      "Adding…",
    "Đang tạm dừng":
      "Paused",
    "Đang yếu ở đâu":
      "Where you are weak",
    "Đang ôn lại cả chủ đề":
      "Reviewing a whole topic",
    "Điện lực":
      "Power",
    "Đã ghi nhận":
      "Recorded",
    "Đã làm":
      "Done",
    "Đã làm gần đây":
      "Done recently",
    "Đã lưu":
      "Saved",
    "Đã lưu.":
      "Saved.",
    "Đã xuất file. Gửi sang máy kia rồi bấm Gộp từ file ở đó nhé.":
      "File exported. Send it to the other machine, then press Merge from a file over there.",
    "Đã ôn hôm nay:":
      "Reviewed today:",
    "Đã đụng tới toàn bộ giáo trình":
      "Touched every part of the syllabus",
    "Đóng":
      "Close",
    "Đóng (Esc)":
      "Close (Esc)",
    "Đúng bao nhiêu phần trăm ở từng chủ đề ra trong đề này":
      "Percent correct per topic in this exam",
    "Đúng bao nhiêu phần trăm ở từng chủ đề vừa ra trong đề này":
      "Percent correct per topic that came up in this exam",
    "Đạt":
      "Pass",
    "Đạt mục tiêu":
      "Goal met",
    "Đạt!":
      "Passed!",
    "Đặt lại tiến độ":
      "Reset progress",
    "Đề này chưa có đáp án nên chưa chấm được.":
      "No answer key for this exam yet, so it cannot be graded.",
    "Đề này chưa có đáp án trong app nên không tính điểm được.":
      "No answer key for this exam in the app, so no score can be given.",
    "Đồng bộ máy tính ↔ điện thoại":
      "Sync desktop ↔ phone",
    "Đồng bộ ngay":
      "Sync now",
    "Đồng bộ tự động qua GitHub":
      "Automatic sync through GitHub",
    "Độ khó:":
      "Difficulty:",
    "đã nộp":
      "submitted",
    "đúng":
      "correct",
    "đạt chu kỳ ôn từ 14 ngày trở lên":
      "reached a review cycle of 14 days or more",
    "để lưu phần vừa sửa.":
      "to save what you just edited.",
    "để mở bài là đồng hồ tự chạy.":
      "to open a question and the clock starts on its own.",
    "để soi lại.":
      "to look back at it.",
    "đỡ vất vả hơn.":
      "less of a slog.",
    "Ảnh hưởng tới KPI ngày, chuỗi ngày và lịch nhiệt":
      "Feeds the daily KPI, the streak and the heat calendar",
    "Ảnh, PDF, Word — hoặc dán ảnh vào ô trên.":
      "Images, PDF, Word — or paste a picture into the box above.",
    "Ở máy kia bấm":
      "On the other machine press",
    "— hết giờ môn nào là nộp môn đó. Điểm đạt là":
      "— when a subject's time is up you submit that subject. The pass mark is",
    "— phân tích":
      "— analysis",
    "← Bài trước":
      "← Previous question",
    "↗ Mở":
      "↗ Open",
    "↗ Mở bài trên denken-ou.com":
      "↗ Open the question on denken-ou.com",
    "Làm đúng":
      "Got it right",
    "Làm sai":
      "Got it wrong",
    "sai":
      "wrong",
    "Ngôn ngữ giao diện":
      "Interface language",
    "Chỉ đổi chữ của app — bài vở và ghi chú của bạn giữ nguyên":
      "Changes the app's own wording only — your questions and notes stay as they are",
    "Chưa chọn — ví dụ G:\\My Drive\\Denken":
      "Not set — e.g. G:\\My Drive\\Denken",
    " · chấm {n} lần":
      " · graded {n} times",
    " · {n} mở hôm nay":
      " · {n} unlocked today",
    " · {n} ý từ thi thử":
      " · {n} parts from mock exams",
    "(môn {i}/{tong})":
      "(subject {i}/{tong})",
    "- 6:30 ra khỏi nhà, đổi tàu ở Shibuya":
      "- Leave home 6:30, change trains at Shibuya",
    "- Mang máy tính CASIO fx-JP500 (có phím √), đồng hồ kim":
      "- Bring the CASIO fx-JP500 (has a √ key) and an analogue watch",
    "/ {tong} bài":
      "/ {tong} questions",
    "; số bài đã ôn của từng ngày thì cộng phần mới của hai bên; huy hiệu và lượt thi thử gộp lại hết. Chạy nhầm hai lần cũng không sao — lần thứ hai sẽ báo “hai bên đã giống nhau”.":
      "; the daily review counts add up whatever is new on either side; badges and mock attempts are all merged. Running it twice by mistake is harmless — the second run just says “both sides already match”.",
    "Bài chưa làm ({n})":
      "Not started ({n})",
    "Bài {n} sao":
      "{n}-star questions",
    "Bàn học sạch sẽ. Muốn học thêm thì chuyển sang “Bài chưa làm”.":
      "Desk is clean. Want more? Switch to “Not started”.",
    "Bỏ trống":
      "Blank",
    "Chưa đạt":
      "Not passed",
    "Chưa đủ dữ liệu để kết luận chỗ nào yếu. Một chủ đề phải có ít nhất {n} lượt chấm mới được xếp hạng — làm đúng một bài rồi sai một bài thì con số 50% chẳng nói lên điều gì.":
      "Not enough data to say where you are weak. A topic needs at least {n} graded attempts before it is ranked — one right and one wrong makes a 50% that means nothing.",
    "Chỉ ôn bài {n} sao":
      "Review only {n}-star questions",
    "Còn {n} bài nữa là đạt mục tiêu hôm nay.":
      "{n} more to hit today's goal.",
    "Còn {n} ngày. Mặc định đang để 2027-03-21 — chỉnh lại cho đúng kỳ thi bạn đăng ký nhé.":
      "{n} days left. The default is 2027-03-21 — set it to the session you actually registered for.",
    "Có lỗi":
      "Error",
    "Có {n} bài đang chờ. Bắt đầu từ bài đầu tiên nhé.":
      "{n} questions are waiting. Start with the first one.",
    "Cấp {cap} · {n} ngày":
      "Level {cap} · {n} days",
    "Ghi chú":
      "Notes",
    "Ghi chú {so}":
      "Note {so}",
    "Gói .zip có cả ảnh đính kèm; file JSON thì không — khôi phục từ JSON sẽ mất ảnh.":
      "The .zip includes attached images; a JSON file does not — restoring from JSON loses them.",
    "Hiện token":
      "Show token",
    "Hãy xuất bản sao lưu và cất ra ngoài máy.":
      "Export a backup and keep it off this machine.",
    "Hết giờ {mon}":
      "Time is up: {mon}",
    "Học bài mới ({n} bài)":
      "Study new questions ({n})",
    "Học bài mới →":
      "Study new questions →",
    "Kết nối được, NHƯNG repo này đang công khai — ghi chú của bạn":
      "Connected, BUT this repo is public — your notes",
    "Kết nối được. Repo đang là Private, đúng rồi.":
      "Connected. The repo is Private, which is right.",
    "Kỳ {ky} · điểm đạt là {diem}/100 mỗi môn":
      "Session {ky} · pass mark is {diem}/100 per subject",
    "Kỷ lục {n} ngày":
      "Record: {n} days",
    "Link phải bắt đầu bằng http":
      "The link must start with http",
    "Link tham khảo của bạn":
      "Your reference links",
    "Làm gần nhất {ngay}":
      "Last done {ngay}",
    "Làm 問{so}":
      "Answer 問{so}",
    "Lần đồng bộ gần nhất: {luc}.":
      "Last sync: {luc}.",
    "Mình đã dành cả thanh xuân để học tiếng Nhật và":
      "I spent my whole youth studying Japanese and",
    "Môn này chỉ được làm":
      "In this subject you may answer only",
    "Mọi bài từng sai đều đã được sửa thành đúng. Quá tốt!":
      "Every question you once got wrong is now right. Excellent!",
    "Mỗi bài lấy bản":
      "Each question keeps the",
    "Mở khoá huy hiệu!":
      "Badge unlocked!",
    "Mở khoá {n} huy hiệu!":
      "{n} badges unlocked!",
    "Mở link tham khảo: {url}":
      "Open reference link: {url}",
    "Mở {duong}":
      "Open {duong}",
    "Mở {ten}":
      "Open {ten}",
    "Nguồn dữ liệu được lấy từ các đường link của trang web":
      "The data comes from links on the site",
    "Ngày thi {ngay}":
      "Exam date {ngay}",
    "Nó chống được xoá nhầm và ghi hỏng, nhưng mất máy thì mất cả hai.":
      "It protects against an accidental delete or a bad write, but losing the machine loses both.",
    "Nộp bài":
      "Submit",
    "Phiên này: {n} lượt":
      "This session: {n} rounds",
    "Quá hạn {n} ngày":
      "{n} days overdue",
    "Sai":
      "Wrong",
    "Sai → Đúng":
      "Wrong → Right",
    "Sát rồi, chỉ còn {n} bài nữa là đạt mục tiêu.":
      "Almost — just {n} more to hit the goal.",
    "Trong đó {n} bài đã quá hạn — nên ưu tiên làm trước.":
      "{n} of them are overdue — do those first.",
    "Tất cả":
      "All",
    "Tất cả chủ đề ({n})":
      "All topics ({n})",
    "Vì thế mình tạo ra công cụ này với mục đích giúp các bạn có thể ôn tập cho kỳ thi":
      "So I built this tool to help you study for the",
    "Ví dụ:":
      "For example:",
    "Xong":
      "Finished",
    "bạn chọn {chon} · đúng là {dung}":
      "you chose {chon} · correct is {dung}",
    "còn {n}":
      "{n} to go",
    "của cả bốn môn, kèm link tới denken-ou.com và độ khó từng bài. Cứ làm bài, app sẽ tự xếp lịch ôn lại đúng lúc bạn sắp quên.":
      "across all four subjects, with links to denken-ou.com and a difficulty for each. Just answer them, and the app schedules the next review right before you would forget.",
    "không có đề":
      "no paper",
    "làm sai":
      "got it wrong",
    "làm đúng":
      "got it right",
    "mỗi môn.":
      "per subject.",
    "mở bài và bắt đầu tính giờ":
      "open the question and start the clock",
    "quá hạn {n}n":
      "{n}d overdue",
    "trên {tong} bài · {pt}%":
      "of {tong} questions · {pt}%",
    "và sang":
      "and move on to",
    "và xếp lịch ôn lại. Vẫn đang ở bài này — cứ ghi chú thoải mái, chuyển bài lúc nào là quyền của bạn. Bấm nhầm thì chấm lại bằng nút kia.":
      "and scheduled the next review. Still on this question — take your time with notes; moving on is up to you. Pressed the wrong button? Grade again with the other one.",
    "{da} / {tong} bài":
      "{da} / {tong} questions",
    "{da}/{tong} bài đã làm":
      "{da}/{tong} questions done",
    "{dung}/{cham} ý":
      "{dung}/{cham} parts",
    "{dung}/{tong} ý đúng":
      "{dung}/{tong} parts correct",
    "{ngay}: {n} bài":
      "{ngay}: {n} questions",
    "{nhan} — đúng {dung}, sai {sai}":
      "{nhan} — {dung} right, {sai} wrong",
    "{n} bài":
      "{n} questions",
    "{n} bài đến hạn ôn hôm nay":
      "{n} questions due for review today",
    "{n} bài/ngày":
      "{n} questions/day",
    "{n} bản":
      "{n} copies",
    "{n} câu":
      "{n} questions",
    "{n} ghi chú":
      "{n} notes",
    "{n} huy hiệu":
      "{n} badges",
    "{n} link tham khảo":
      "{n} reference links",
    "{n} lần · bấm vào một lượt để xem phân tích từng câu":
      "{n} attempts · tap one to see the per-question analysis",
    "{n} phút":
      "{n} min",
    "{n} phút →":
      "{n} min →",
    "{n} ý chưa có đáp án, không tính điểm":
      "{n} parts have no answer key and are not scored",
    "{n} đến hạn":
      "{n} due",
    "{trang}: {n}":
      "{trang}: {n}",
    "· {tong} bài, còn {con} bài chưa xử lý)":
      "· {tong} questions, {con} still to handle)",
    "Ôn lại {ngay}":
      "Review again {ngay}",
    "Ôn đúng lịch giúp nhớ lâu hơn nhiều so với học dồn.":
      "Reviewing on schedule sticks far better than cramming.",
    "ý (B問題 mỗi câu 2 ý). Điểm sẽ được quy về thang 100 trên phần chấm được, số câu còn lại không tính là sai.":
      "parts (each B問題 has 2). The score is scaled to 100 over the part that can be graded; the rest is not counted as wrong.",
    "Đang bật":
      "On",
    "Đang làm sai ({n})":
      "Currently wrong ({n})",
    "Đang tính giờ":
      "Running",
    "Đang tắt":
      "Off",
    "Đang đồng bộ…":
      "Syncing…",
    "Đánh dấu bài này là đáng chú ý":
      "Mark this question as worth another look",
    "Đánh dấu sao":
      "Starred",
    "Đánh dấu sao ({n})":
      "Starred ({n})",
    "Đã có file Excel theo dõi từ trước?":
      "Already tracking in an Excel file?",
    "Đã khôi phục dữ liệu từ bản sao lưu.":
      "Data restored from the backup.",
    "Đã nhân bản sang {duong}":
      "Mirrored to {duong}",
    "Đã nhân bản sang {duong} (chép thêm {n} file đính kèm).":
      "Mirrored to {duong} ({n} attachments copied too).",
    "Đã nhập dữ liệu từ Excel.":
      "Imported from Excel.",
    "Đã nhập {bai} bài: {gc} ghi chú, {link} link tham khảo, {lich} bài đang trong chu kỳ ôn.":
      "Imported {bai} questions: {gc} notes, {link} reference links, {lich} already in a review cycle.",
    "Đã trả lời {da}/{can} ý":
      "Answered {da}/{can} parts",
    "Đã xuất bản sao lưu: {duong}":
      "Backup exported: {duong}",
    "Đã xuất file Excel: {duong}":
      "Excel file exported: {duong}",
    "Đã xuất gói đầy đủ: {duong}":
      "Full bundle exported: {duong}",
    "Đã đồng bộ":
      "Synced",
    "Đính kèm file":
      "Attach a file",
    "Đúng":
      "Right",
    "Đúng {n}":
      "{n} right",
    "Đến hạn":
      "Due",
    "Đến hạn hôm nay ({n})":
      "Due today ({n})",
    "Độ khó {n}/5":
      "Difficulty {n}/5",
    "đúng {dung}/{tong} ý":
      "{dung}/{tong} parts right",
    "đến hạn":
      "due",
    "để xử lý hết {con} bài còn nợ ({chua} chưa làm + {sai} đang sai).":
      "to clear the {con} you still owe ({chua} not started + {sai} currently wrong).",
    "Ảnh đính kèm không đi theo — chỉ tiến độ, ghi chú, link và lịch sử thi.":
      "Attached images do not travel — only progress, notes, links and exam history.",
    "— {cau} câu, {mon} môn":
      "— {cau} questions, {mon} subjects",
  },
  ja: {
    " · sắp hết giờ!":
      " · まもなく時間切れ！",
    " — chốt đáp án và chấm kết quả nhé":
      " — 解答を確定して採点しましょう",
    "+ Thêm ghi chú":
      "＋ メモを追加",
    "+ Thêm link":
      "＋ リンクを追加",
    ", không làm cả hai.":
      "、両方はできません。",
    ", xong môn này mới sang môn kia:":
      "、1 科目ずつ順に進みます：",
    "- Cơm nắm ăn giữa 電力 và 機械 (nghỉ 1 tiếng 20)":
      "- 電力と機械の間におにぎり（休憩 1 時間 20 分）",
    "12 tuần":
      "12 週間",
    "14 ngày tới":
      "これからの 14 日間",
    "17 tuần qua":
      "直近 17 週間",
    ": hai máy cùng ghi một lúc thì bên sau đọc lại rồi gộp lại, không bên nào mất.":
      "：両方の端末が同時に書いても、後から書いた側が読み直して統合するので、どちらのデータも消えません。",
    "App đã có sẵn đầy đủ":
      "アプリに最初から入っています",
    "Ba ngày gần nhất":
      "直近 3 日間",
    "Biết trước ngày nào nặng để sắp xếp thời gian.":
      "どの日が重いか先に分かるので、予定を組みやすくなります。",
    "Bài làm sai xếp lên trước — đó là thứ cần nhìn lại.":
      "間違えた問題を先頭に。見直す価値があるのはそこです。",
    "Bài sau →":
      "次の問題 →",
    "Bài đã tự nộp. Mở app xem điểm nhé.":
      "自動で提出しました。アプリで点数を確認してください。",
    "Bàn học sạch":
      "机の上がきれい",
    "Bạn vẫn thi và bấm giờ bình thường, nhưng phần chấm điểm sẽ để trống. Nạp đáp án bằng":
      "受験も計時もいつも通りできますが、採点は空欄のままになります。解答は次で読み込めます：",
    "Bạn đã đánh dấu bài này":
      "この問題に印をつけています",
    "Bản cài đặt và dữ liệu nằm ở hai thư mục tách biệt — trình cài đặt chỉ ghi đè phần chương trình, không đụng tới thư mục dữ liệu bên dưới.":
      "プログラムとデータは別々のフォルダにあります。インストーラーが上書きするのはプログラムだけで、下のデータフォルダには触れません。",
    "Bản sao lưu hằng ngày nằm cùng máy với bản gốc.":
      "毎日のバックアップは、元データと同じ端末の中にあります。",
    "Bản sao lưu tự động":
      "自動バックアップ",
    "Bấm":
      "押す",
    "Bật đồng bộ":
      "同期をオンにする",
    "Bắt đầu":
      "開始",
    "Bắt đầu lại":
      "やり直す",
    "Bắt đầu thi →":
      "試験を始める →",
    "Bắt đầu tính giờ":
      "計時を開始",
    "Bắt đầu ôn →":
      "復習を始める →",
    "Bỏ chọn hết":
      "すべて解除",
    "Bỏ lọc":
      "絞り込みを解除",
    "Bỏ lọc sao":
      "星の絞り込みを解除",
    "Bỏ những bài đã xử lý xong khỏi danh sách rồi dựng lại từ đầu":
      "片づいた問題をリストから外して作り直す",
    "Bỏ đánh dấu bài này":
      "この問題の印を外す",
    "Bỏ đồng hồ":
      "タイマーを外す",
    "Bốn môn":
      "4 科目",
    "Bốn môn trong một ngày":
      "1 日で 4 科目",
    "Bốn môn trọn vẹn":
      "4 科目すべて制覇",
    "Chu kỳ ôn tập":
      "復習の周期",
    "Chuyển dữ liệu từ file Excel":
      "Excel ファイルからデータを取り込む",
    "Chuỗi ngày":
      "連続日数",
    "Chuỗi ngày liên tiếp đạt mục tiêu":
      "目標を達成した連続日数",
    "Chào buổi chiều":
      "こんにちは",
    "Chào buổi sáng":
      "おはようございます",
    "Chào buổi trưa":
      "こんにちは",
    "Chào buổi tối":
      "こんばんは",
    "Chào mừng bạn đến với sổ ôn thi":
      "学習ノートへようこそ",
    "Chép cả file đính kèm. File đính kèm chỉ chép một lần vì tên không đổi, nên mỗi lần ghi chỉ tốn vài trăm KB của data.json.":
      "添付ファイルも一緒にコピーされます。ファイル名が変わらないので各ファイルのコピーは一度きり、保存のたびに data.json が増えるのは数百 KB です。",
    "Chưa chấm bài nào trong ba ngày qua. Làm vài bài là hiện ngay ở đây.":
      "この 3 日間、採点した問題がありません。何問か解けばここに出てきます。",
    "Chưa chấm được":
      "採点できません",
    "Chưa có dữ liệu. Ôn vài bài là biểu đồ hiện lên ngay.":
      "まだデータがありません。何問か復習すればグラフが出ます。",
    "Chưa có ghi chú nào. Bấm “Thêm ghi chú” để viết cách giải hoặc chỗ hay nhầm.":
      "メモはまだありません。「メモを追加」を押して、解き方やよく間違えるところを書いておきましょう。",
    "Chưa có huy hiệu nào — cứ học đều, tự khắc mở khoá.":
      "バッジはまだありません。続けていれば自然と開きます。",
    "Chưa có link nào. Dán link Gemini, YouTube, blog… mà bạn dùng cho bài này.":
      "リンクはまだありません。この問題で使った Gemini・YouTube・ブログなどのリンクを貼ってください。",
    "Chưa làm":
      "未着手",
    "Chưa đánh dấu bài nào":
      "印をつけた問題はありません",
    "Chạy ngầm mỗi lần mở app":
      "アプリを開くたびに裏で実行",
    "Chỉ dùng một lần, cho ai trước đây theo dõi tiến độ bằng file Excel “Bài tập điện hạng 3”. Ghi đè tiến độ hiện có của các bài trùng.":
      "一度きりの機能です。以前「Bài tập điện hạng 3」の Excel で進捗を管理していた方向け。重複する問題の進捗は上書きされます。",
    "Chọn cả 4 môn":
      "4 科目すべてを選ぶ",
    "Chọn kỳ thi":
      "試験回を選ぶ",
    "Chọn môn thi":
      "科目を選ぶ",
    "Chọn một thư mục trong Google Drive hoặc OneDrive ở dưới, app sẽ tự chép sang đó sau mỗi lần ghi.":
      "下で Google ドライブか OneDrive のフォルダを選ぶと、保存のたびにそこへ複製します。",
    "Chọn một trong hai câu cuối.":
      "最後の 2 問はどちらか一方を解答します。",
    "Chọn thư mục…":
      "フォルダを選ぶ…",
    "Chốt đáp án rồi chấm đúng/sai nhé.":
      "解答を確定してから、正誤をつけましょう。",
    "Chủ đề này chưa có bài nào":
      "この分野にはまだ問題がありません",
    "Cài đặt":
      "設定",
    "Cách giải, chỗ hay nhầm, công thức cần nhớ… (dán ảnh chụp màn hình thẳng vào đây được)":
      "解き方、よく間違えるところ、覚えたい公式など…（スクリーンショットをそのまま貼り付けられます）",
    "Còn lại tới kỳ thi":
      "試験までの残り",
    "Có file đính kèm":
      "添付ファイルあり",
    "Có mặt trong phòng trước giờ bắt đầu 20 phút. Quá 30 phút sau giờ bắt đầu là hết quyền vào.":
      "開始 20 分前には着席してください。開始後 30 分を過ぎると入室できません。",
    "Có thể tên chủ đề đã đổi ở bản danh mục mới. Thử tìm trong Danh sách bài.":
      "新しい目録で分野名が変わった可能性があります。問題一覧で探してみてください。",
    "Cần":
      "必要",
    "Cập nhật app không làm mất dữ liệu.":
      "アプリを更新してもデータは消えません。",
    "Cờ Việt Nam":
      "ベトナム国旗",
    "Của riêng bạn":
      "あなただけのもの",
    "Cựu sinh viên khoa":
      "卒業：",
    "Cựu sinh viên khoa Tự động hoá, Đại học Bách Khoa Hà Nội. Làm công cụ này để việc ôn":
      "ハノイ工科大学 オートメーション工学科 卒業。学習を",
    "Danh sách bài":
      "問題一覧",
    "Dừng ở đây, xem điểm":
      "ここで終えて点数を見る",
    "Dữ liệu của bạn":
      "あなたのデータ",
    "Dựng lại danh sách":
      "リストを作り直す",
    "File JSON không mang theo ảnh đính kèm — ảnh ở máy nào vẫn nằm ở máy đó.":
      "JSON ファイルに添付画像は入りません。画像は元の端末に残ります。",
    "Ga nào xuống, mấy giờ ra khỏi nhà, mang theo gì. Đồng bộ sang điện thoại như mọi ghi chú khác.":
      "どの駅で降りるか、何時に家を出るか、何を持っていくか。ほかのメモと同じようにスマホへ同期されます。",
    "Ghi chú cho hôm thi":
      "試験当日のメモ",
    "Ghi nhận làm sai":
      "不正解として記録",
    "Ghi nhận làm đúng":
      "正解として記録",
    "Ghi theo kiểu nguyên tử: ghi ra file tạm rồi mới đổi tên đè lên, mất điện giữa chừng cũng không làm hỏng dữ liệu.":
      "書き込みは原子的です。いったん一時ファイルに書いてから名前を付け替えるので、途中で電源が落ちてもデータは壊れません。",
    "Giấu token":
      "トークンを隠す",
    "Giờ thi từng môn":
      "科目ごとの試験時間",
    "Gặp bài hay hoặc bài dễ nhầm thì bấm ngôi sao ở góc thẻ bài. Sát ngày thi, đây là danh sách đáng lật lại nhất.":
      "良問だと思ったり、引っかかりやすいと感じたら、カード隅の星を押しておきましょう。試験直前に一番見返す価値のあるリストになります。",
    "Gộp chứ không ghi đè.":
      "上書きではなく統合です。",
    "Gộp hai bên bằng một file, không bên nào mất dữ liệu":
      "1 つのファイルで両側を統合。どちらのデータも失われません",
    "Gộp từ file":
      "ファイルから統合",
    "Gộp từ file của máy kia":
      "もう一方の端末のファイルから統合",
    "Gỡ file này":
      "このファイルを削除",
    "Gửi file đó sang máy kia — Drive, Zalo, Telegram, dây USB, kiểu gì cũng được.":
      "そのファイルをもう一方の端末へ送ってください。Drive でも Zalo でも Telegram でも USB でも構いません。",
    "Hoãn 1 ngày":
      "1 日延ばす",
    "Hoãn 1 tuần":
      "1 週間延ばす",
    "Huy hiệu đã đạt":
      "獲得したバッジ",
    "Huy hiệu được giữ kín cho tới lúc bạn chạm mốc. Đang học mà đạt được thì app sẽ báo ngay.":
      "バッジは達成するまで伏せてあります。学習中に達成すると、その場で知らせます。",
    "Hôm nay":
      "今日",
    "Hôm nay chưa làm bài nào. Mở màn thôi!":
      "今日はまだ 1 問も解いていません。始めましょう！",
    "Hết giờ làm bài":
      "試験時間終了",
    "Hết giờ rồi!":
      "時間切れです！",
    "Học bài đầu tiên →":
      "最初の 1 問を学ぶ →",
    "Học hôm nay để giữ chuỗi":
      "連続日数を切らさないよう今日も学習を",
    "Khuya rồi, cố lên":
      "夜更かしですね、頑張って",
    "Khôi phục sau sự cố":
      "トラブルからの復旧",
    "Khôi phục từ bản sao lưu":
      "バックアップから復元",
    "Không còn bài chưa làm ở cả bốn môn":
      "4 科目とも未着手の問題がゼロ",
    "Không còn bài nào chưa làm khớp bộ lọc. Quay lại ôn theo lịch nhé.":
      "絞り込みに合う未着手の問題はありません。予定どおりの復習に戻りましょう。",
    "Không còn bài nào đang sai":
      "いま間違えている問題はありません",
    "Không còn bài nào đến hạn":
      "期限が来た問題はありません",
    "Không có bài nào khớp":
      "該当する問題がありません",
    "Không có bài nào khớp bộ lọc. Thử bỏ bớt điều kiện xem sao.":
      "絞り込みに合う問題がありません。条件を減らしてみてください。",
    "Không có bài sai nào khớp bộ lọc.":
      "絞り込みに合う不正解の問題はありません。",
    "Không khôi phục được.":
      "復元できませんでした。",
    "Không làm câu này":
      "この問題は解答しない",
    "Không lưu được ảnh dán vào.":
      "貼り付けた画像を保存できませんでした。",
    "Không lưu, thi lại":
      "保存せずにやり直す",
    "Không nhập được.":
      "取り込めませんでした。",
    "Không đọc được file.":
      "ファイルを読み込めませんでした。",
    "Kiểm tra kết nối":
      "接続を確認",
    "Link bài tập đi kèm app, còn ghi chú và link tham khảo là của riêng bạn — cập nhật app không làm mất phần này.":
      "問題リンクはアプリに同梱ですが、メモと参考リンクはあなただけのものです。アプリを更新しても消えません。",
    "Luật thi":
      "試験の規則",
    "Làm nguyên một kỳ thi thật, có bấm giờ và chấm điểm":
      "本番と同じ形式で、時間を計って採点まで",
    "Làm đúng thì bài lên một cấp và hẹn ôn lại xa hơn. Làm sai thì về cấp 1, mai ôn lại. Đây đúng là chu kỳ trong file Excel gốc của bạn.":
      "正解すると 1 段上がって次の復習が先に延び、不正解だと 1 段目に戻って明日また出ます。元の Excel と同じ周期です。",
    "Lý thuyết":
      "理論",
    "Lưu ghi chú":
      "メモを保存",
    "Lưu kết quả và quay lại":
      "結果を保存して戻る",
    "Lượt thi này được lưu bằng bản app cũ nên chỉ có điểm, không có bài làm từng câu. Những lượt thi từ giờ trở đi đều có bảng phân tích đầy đủ.":
      "この受験は古いバージョンで保存されたため、点数だけで設問ごとの解答が残っていません。今後の受験にはすべて詳しい分析が付きます。",
    "Lấy lại toàn bộ dữ liệu từ một bản sao lưu. Thay thế tiến độ hiện tại.":
      "バックアップからすべてのデータを戻します。いまの進捗は置き換えられます。",
    "Lịch sử thi thử":
      "模擬試験の履歴",
    "Lịch ôn sắp tới":
      "これからの復習予定",
    "Lỗi khi lưu":
      "保存エラー",
    "Muốn chắc ăn hơn nữa thì thỉnh thoảng bấm “Xuất bản sao lưu” rồi cất lên Google Drive.":
      "さらに安心したいなら、ときどき「バックアップを書き出す」を押して Google ドライブに置いておきましょう。",
    "Muốn hai bên giống hệt nhau thì làm ngược lại một lượt nữa.":
      "両側を完全に同じにしたいなら、逆向きにもう一度同じことをしてください。",
    "Máy tính và điện thoại cùng đọc ghi một file trong repo riêng tư của bạn":
      "パソコンとスマホが、あなたのプライベートリポジトリにある 1 つのファイルを読み書きします",
    "Máy đang có dữ liệu mới hơn: bấm":
      "この端末のほうが新しいデータです。押してください：",
    "Máy điện":
      "機械",
    "Mất quyền thi":
      "受験資格を失う",
    "Mỗi môn có đồng hồ riêng,":
      "科目ごとに別のタイマーがあり、",
    "Mỗi ngày mở app giữ lại một bản, quá số này thì bản cũ nhất bị xoá.":
      "アプリを開いた日ごとに 1 つ残します。この数を超えると古いものから消えます。",
    "Một ngày được tính vào chuỗi khi số bài ôn đạt mức này.":
      "この数だけ復習すると、その日が連続日数に入ります。",
    "MỚI":
      "新着",
    "Mới có đáp án cho":
      "解答が用意できているのは",
    "Mở bài trên denken-ou.com":
      "denken-ou.com で問題を開く",
    "Mở lời giải trên denken-ou.com":
      "denken-ou.com で解説を開く",
    "Mở thư mục dữ liệu":
      "データフォルダを開く",
    "Mở đề bài trên denken-ou.com":
      "denken-ou.com で問題文を開く",
    "Mục tiêu học":
      "学習の目標",
    "Mục tiêu mỗi ngày (số bài)":
      "1 日の目標（問題数）",
    "Nghỉ một chút rồi thi tiếp. Môn sau có đồng hồ riêng, bấm nút mới bắt đầu tính giờ — thời gian nghỉ không bị trừ vào bài.":
      "次の科目まで少し休みましょう。科目ごとに別のタイマーで、ボタンを押してから計時が始まります。休憩時間が試験時間から引かれることはありません。",
    "Nguồn":
      "出典",
    "Ngày thi":
      "試験日",
    "Nhiều":
      "多い",
    "Nhân bản không thành công.":
      "複製できませんでした。",
    "Nhân bản ngay":
      "いますぐ複製",
    "Nhập từ file Excel":
      "Excel ファイルから取り込む",
    "Nhập vào đây":
      "ここに入力",
    "Nhịp học":
      "学習のリズム",
    "Nhớ lâu":
      "しっかり定着",
    "Những bài bạn tự đánh dấu là đáng chú ý":
      "見返す価値ありと自分で印をつけた問題",
    "Ninh Bình, Việt Nam":
      "ベトナム・ニンビン",
    "Nyren Phạm":
      "Nyren Phạm",
    "Nơi cất và cách sao lưu":
      "保管場所とバックアップの方法",
    "Nếu file chính hỏng, app tự lấy bản sao lưu mới nhất còn đọc được và cất file hỏng sang thư mục":
      "メインのファイルが壊れた場合、アプリは読める最新のバックアップを使い、壊れたファイルをこちらへ移します：",
    "Nộp":
      "提出",
    "Nộp bài và xem điểm":
      "提出して点数を見る",
    "Nộp môn này":
      "この科目を提出",
    "Nộp rồi là không quay lại sửa được, giống phòng thi thật.":
      "提出したら戻って直せません。本番の試験室と同じです。",
    "Phiên bản app":
      "アプリのバージョン",
    "Pháp quy":
      "法規",
    "Phím tắt:":
      "ショートカット：",
    "Phím ←":
      "← キー",
    "Phím →":
      "→ キー",
    "Phần trên chép từ tờ 受験票 và tờ hướng dẫn kèm theo. Quy chế có thể đổi theo từng kỳ — sát ngày thi nên mở trang chính thức xem lại một lượt.":
      "上の内容は受験票と同封の案内から書き写したものです。規則は回ごとに変わることがあります。試験が近づいたら公式サイトを一度読み直してください。",
    "Repo riêng tư (tài-khoản/tên-repo)":
      "プライベートリポジトリ（アカウント/リポジトリ名）",
    "Sao lưu ra ngoài máy tính":
      "パソコンの外へバックアップ",
    "Sao lưu tự động trên máy":
      "この端末での自動バックアップ",
    "Sơ đồ hội trường, tra kết quả, và bản quy chế đầy đủ đều ở đây.":
      "会場の案内図、合否の照会、規則の全文はすべてそこにあります。",
    "Số bài có tiến độ":
      "進捗のある問題数",
    "Số bài đã ôn hôm nay trên mục tiêu":
      "今日復習した問題数と目標の比",
    "Số bản sao lưu giữ lại":
      "残すバックアップの数",
    "Số lượt ôn mỗi tuần":
      "週ごとの復習回数",
    "Sổ ôn thi":
      "学習ノート",
    "Thao tác không thành công.":
      "うまくいきませんでした。",
    "Thi thử":
      "模擬試験",
    "Thoát":
      "終了",
    "Thoát chế độ chủ đề":
      "分野モードを抜ける",
    "Thành tích":
      "実績",
    "Thư mục dữ liệu":
      "データフォルダ",
    "Thư mục nhân bản":
      "複製先フォルダ",
    "Thứ duy nhất cứu được bạn khi ổ cứng hỏng hoặc mất máy":
      "ドライブが壊れたり端末をなくしたとき、頼りになるのはこれだけです",
    "Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.":
      "絞り込みを減らすか、検索語を変えてみてください。",
    "Tiến độ từng môn":
      "科目ごとの進捗",
    "Tiếp tục":
      "続ける",
    "Token nằm riêng,":
      "トークンは別の場所にあり、",
    "Top 5 mỗi môn":
      "科目ごとのワースト 5",
    "Trang chính thức của trung tâm khảo thí":
      "試験センターの公式サイト",
    "Tuyệt vời, học tiếp thôi!":
      "いい調子です。この調子で！",
    "Tên gợi nhớ":
      "分かりやすい名前",
    "Tìm theo tên bài, chủ đề, kỳ thi, hoặc trong ghi chú…":
      "問題名・分野・試験回・メモの中身で検索…",
    "Tính gộp cả lượt ôn tập lẫn từng ý trong đề thi thử. Bấm một chủ đề để ôn lại cả chủ đề đó.":
      "復習と模擬試験の各設問の両方を集計しています。分野を押すとその分野をまとめて復習できます。",
    "Tạm dừng":
      "一時停止",
    "Tạo một repo":
      "リポジトリを作る",
    "Tất cả môn":
      "全科目",
    "Tắt":
      "オフ",
    "Tắt chuông":
      "アラームを止める",
    "Tắt đồng bộ":
      "同期をオフにする",
    "Tổng tiến độ":
      "全体の進捗",
    "Từng câu":
      "設問ごと",
    "Từng câu — bạn chọn gì, đáp án đúng là gì":
      "設問ごと — 選んだ答えと正解",
    "Tự chạy lúc mở app, lúc quay lại app, và mỗi 5 phút. Vẫn là":
      "アプリを開いたとき、戻ったとき、そして 5 分ごとに実行します。あくまで",
    "Tự động hoá, Đại học Bách Khoa Hà Nội":
      "ハノイ工科大学 オートメーション工学科",
    "Về tác giả":
      "作者について",
    "Xem thêm":
      "もっと見る",
    "Xin cảm ơn mọi người đã đọc.":
      "お読みいただきありがとうございます。",
    "Xong mục tiêu hôm nay rồi. Nghỉ ngơi thôi!":
      "今日の目標は達成です。ひと休みしましょう！",
    "Xoá ghi chú này":
      "このメモを削除",
    "Xoá link này":
      "このリンクを削除",
    "Xoá lần thi này":
      "この受験記録を削除",
    "Xoá trạng thái và lịch ôn, giữ nguyên ghi chú và link tham khảo":
      "状態と復習予定を消し、メモと参考リンクは残す",
    "Xuất bản sao lưu (JSON)":
      "バックアップを書き出す（JSON）",
    "Xuất file để mang sang":
      "持ち運ぶファイルを書き出す",
    "Xuất ra Excel":
      "Excel に書き出す",
    "Xuất toàn bộ (.zip)":
      "すべて書き出す（.zip）",
    "chuyển bài. Chấm xong app không tự nhảy bài — bạn tự chuyển khi đã ghi chú xong.":
      "で問題を切り替えます。採点しても自動では進みません。メモを書き終えてから自分で進めてください。",
    "chưa có đáp án":
      "解答はまだありません",
    "chưa lần nào":
      "まだ一度もありません",
    "còn lại trong giáo trình":
      "教材の残り",
    "cần quay lại xử lý":
      "やり直しが必要",
    "gộp chứ không ghi đè":
      "上書きではなく統合",
    "hai bên đã giống nhau":
      "両側はすでに同じです",
    "hoặc":
      "または",
    "hôm nay":
      "今日",
    "không":
      "ではなく",
    "không cộng dồn thời gian":
      "時間は繰り越されません",
    "lần lượt từng môn":
      "1 科目ずつ順に",
    "mất file":
      "ファイルが見つかりません",
    "một cách khoa học và đỡ vất vả.":
      "より筋道立てて、より楽にするために作りました。",
    "ngày":
      "日",
    "ngày liên tiếp đạt mục tiêu":
      "目標を達成した連続日数",
    "ngày tới kỳ thi":
      "試験までの日数",
    "nằm trong data.json — nên file bạn xuất ra hay chép sang Drive không mang theo nó.":
      "は data.json の中にあります。書き出したファイルや Drive へコピーしたファイルには含まれません。",
    "riêng cho dữ liệu, đừng dùng chung repo mã nguồn.":
      "はデータ専用に。ソースコードのリポジトリを使い回さないでください。",
    "rồi chọn file vừa nhận.":
      "を押して、受け取ったファイルを選んでください。",
    "sẽ ai cũng đọc được. Chuyển sang Private đi đã.":
      "だと誰でも読めてしまいます。まず Private に変えてください。",
    "sửa sau cùng":
      "最終更新",
    "trống và Private":
      "空で Private",
    "tính theo ý — B問題 mỗi câu 2 ý":
      "設問単位で集計。B問題は 1 問あたり 2 設問",
    "Ít":
      "少ない",
    "Ô càng sáng là ngày đó học càng nhiều.":
      "マスが明るいほど、その日たくさん学習しています。",
    "Ôn hết bài đến hạn, không còn bài nào quá hạn":
      "期限の来た問題をすべて復習し、遅れがゼロ",
    "Ôn lại toàn bộ chủ đề này":
      "この分野をまとめて復習",
    "Ôn lại →":
      "もう一度復習 →",
    "Ôn tập":
      "復習",
    "Đang chờ lưu…":
      "保存待ち…",
    "Đang kiểm tra…":
      "確認中…",
    "Đang lưu…":
      "保存中…",
    "Đang mở sổ ôn thi…":
      "ノートを開いています…",
    "Đang sai":
      "いま不正解",
    "Đang thêm…":
      "追加中…",
    "Đang tạm dừng":
      "一時停止中",
    "Đang yếu ở đâu":
      "苦手なところ",
    "Đang ôn lại cả chủ đề":
      "分野をまとめて復習中",
    "Điện lực":
      "電力",
    "Đã ghi nhận":
      "記録しました",
    "Đã làm":
      "解答済み",
    "Đã làm gần đây":
      "最近解答",
    "Đã lưu":
      "保存済み",
    "Đã lưu.":
      "保存しました。",
    "Đã xuất file. Gửi sang máy kia rồi bấm Gộp từ file ở đó nhé.":
      "ファイルを書き出しました。もう一方の端末へ送り、そちらで「ファイルから統合」を押してください。",
    "Đã ôn hôm nay:":
      "今日の復習：",
    "Đã đụng tới toàn bộ giáo trình":
      "教材のすべてに手をつけた",
    "Đóng":
      "閉じる",
    "Đóng (Esc)":
      "閉じる（Esc）",
    "Đúng bao nhiêu phần trăm ở từng chủ đề ra trong đề này":
      "この試験の分野ごとの正答率",
    "Đúng bao nhiêu phần trăm ở từng chủ đề vừa ra trong đề này":
      "この試験に出た分野ごとの正答率",
    "Đạt":
      "合格",
    "Đạt mục tiêu":
      "目標達成",
    "Đạt!":
      "合格です！",
    "Đặt lại tiến độ":
      "進捗をリセット",
    "Đề này chưa có đáp án nên chưa chấm được.":
      "この回の解答がまだないため、採点できません。",
    "Đề này chưa có đáp án trong app nên không tính điểm được.":
      "この回の解答がアプリにないため、点数を出せません。",
    "Đồng bộ máy tính ↔ điện thoại":
      "パソコン ↔ スマホの同期",
    "Đồng bộ ngay":
      "いますぐ同期",
    "Đồng bộ tự động qua GitHub":
      "GitHub で自動同期",
    "Độ khó:":
      "難易度：",
    "đã nộp":
      "提出済み",
    "đúng":
      "正解",
    "đạt chu kỳ ôn từ 14 ngày trở lên":
      "復習の周期が 14 日以上に達した",
    "để lưu phần vừa sửa.":
      "で編集内容を保存します。",
    "để mở bài là đồng hồ tự chạy.":
      "で問題を開くと、タイマーが自動で動き出します。",
    "để soi lại.":
      "で見返せます。",
    "đỡ vất vả hơn.":
      "楽になるように。",
    "Ảnh hưởng tới KPI ngày, chuỗi ngày và lịch nhiệt":
      "1 日の目標・連続日数・ヒートカレンダーに反映されます",
    "Ảnh, PDF, Word — hoặc dán ảnh vào ô trên.":
      "画像・PDF・Word、または上の欄に画像を貼り付け。",
    "Ở máy kia bấm":
      "もう一方の端末で押してください：",
    "— hết giờ môn nào là nộp môn đó. Điểm đạt là":
      "— 科目の時間が来たらその科目を提出します。合格ラインは",
    "— phân tích":
      "— 分析",
    "← Bài trước":
      "← 前の問題",
    "↗ Mở":
      "↗ 開く",
    "↗ Mở bài trên denken-ou.com":
      "↗ denken-ou.com で問題を開く",
    "Làm đúng":
      "正解した",
    "Làm sai":
      "間違えた",
    "sai":
      "不正解",
    "Ngôn ngữ giao diện":
      "表示言語",
    "Chỉ đổi chữ của app — bài vở và ghi chú của bạn giữ nguyên":
      "アプリの表示だけを変えます。問題とメモはそのままです",
    "Chưa chọn — ví dụ G:\\My Drive\\Denken":
      "未設定 — 例：G:\\My Drive\\Denken",
    " · chấm {n} lần":
      " · {n} 回採点",
    " · {n} mở hôm nay":
      " · 今日 {n} 個開放",
    " · {n} ý từ thi thử":
      " · 模擬試験から {n} 設問",
    "(môn {i}/{tong})":
      "（{tong} 科目中 {i} 科目め）",
    "- 6:30 ra khỏi nhà, đổi tàu ở Shibuya":
      "- 6:30 に家を出る、渋谷で乗り換え",
    "- Mang máy tính CASIO fx-JP500 (có phím √), đồng hồ kim":
      "- CASIO fx-JP500（√ キーあり）とアナログ時計を持参",
    "/ {tong} bài":
      "/ {tong} 問",
    "; số bài đã ôn của từng ngày thì cộng phần mới của hai bên; huy hiệu và lượt thi thử gộp lại hết. Chạy nhầm hai lần cũng không sao — lần thứ hai sẽ báo “hai bên đã giống nhau”.":
      "。日ごとの復習数は両側の新しい分を足し合わせ、バッジと模擬試験の記録はすべて統合します。誤って 2 回実行しても問題ありません——2 回目は「両側はすでに同じです」と表示されるだけです。",
    "Bài chưa làm ({n})":
      "未着手（{n}）",
    "Bài {n} sao":
      "星 {n} の問題",
    "Bàn học sạch sẽ. Muốn học thêm thì chuyển sang “Bài chưa làm”.":
      "机の上はきれいです。もっと解きたいなら「未着手」に切り替えてください。",
    "Bỏ trống":
      "未解答",
    "Chưa đạt":
      "不合格",
    "Chưa đủ dữ liệu để kết luận chỗ nào yếu. Một chủ đề phải có ít nhất {n} lượt chấm mới được xếp hạng — làm đúng một bài rồi sai một bài thì con số 50% chẳng nói lên điều gì.":
      "苦手を判断するにはデータが足りません。分野ごとに最低 {n} 回の採点が必要です——1 問正解・1 問不正解の 50% には何の意味もありません。",
    "Chỉ ôn bài {n} sao":
      "星 {n} の問題だけ復習",
    "Còn {n} bài nữa là đạt mục tiêu hôm nay.":
      "今日の目標まであと {n} 問。",
    "Còn {n} ngày. Mặc định đang để 2027-03-21 — chỉnh lại cho đúng kỳ thi bạn đăng ký nhé.":
      "残り {n} 日。初期値は 2027-03-21 です——実際に申し込んだ回に合わせてください。",
    "Có lỗi":
      "エラー",
    "Có {n} bài đang chờ. Bắt đầu từ bài đầu tiên nhé.":
      "{n} 問が待っています。まず 1 問目から。",
    "Cấp {cap} · {n} ngày":
      "レベル {cap} · {n} 日",
    "Ghi chú":
      "メモ",
    "Ghi chú {so}":
      "メモ {so}",
    "Gói .zip có cả ảnh đính kèm; file JSON thì không — khôi phục từ JSON sẽ mất ảnh.":
      ".zip には添付画像も入りますが、JSON には入りません——JSON から復元すると画像は失われます。",
    "Hiện token":
      "トークンを表示",
    "Hãy xuất bản sao lưu và cất ra ngoài máy.":
      "バックアップを書き出して、この端末の外に置いてください。",
    "Hết giờ {mon}":
      "{mon} 終了",
    "Học bài mới ({n} bài)":
      "新しい問題を学ぶ（{n} 問）",
    "Học bài mới →":
      "新しい問題を学ぶ →",
    "Kết nối được, NHƯNG repo này đang công khai — ghi chú của bạn":
      "接続できましたが、このリポジトリは公開されています——あなたのメモは",
    "Kết nối được. Repo đang là Private, đúng rồi.":
      "接続できました。リポジトリは Private です。これで正解です。",
    "Kỳ {ky} · điểm đạt là {diem}/100 mỗi môn":
      "{ky} 回 · 合格ラインは科目ごとに {diem}/100",
    "Kỷ lục {n} ngày":
      "最高記録 {n} 日",
    "Link phải bắt đầu bằng http":
      "リンクは http で始まる必要があります",
    "Link tham khảo của bạn":
      "あなたの参考リンク",
    "Làm gần nhất {ngay}":
      "最終解答 {ngay}",
    "Làm 問{so}":
      "問{so} を解く",
    "Lần đồng bộ gần nhất: {luc}.":
      "最終同期：{luc}。",
    "Mình đã dành cả thanh xuân để học tiếng Nhật và":
      "青春をまるごと日本語と",
    "Môn này chỉ được làm":
      "この科目で解答できるのは",
    "Mọi bài từng sai đều đã được sửa thành đúng. Quá tốt!":
      "かつて間違えた問題はすべて正解になりました。素晴らしい！",
    "Mỗi bài lấy bản":
      "各問題は",
    "Mở khoá huy hiệu!":
      "バッジ開放！",
    "Mở khoá {n} huy hiệu!":
      "バッジ {n} 個開放！",
    "Mở link tham khảo: {url}":
      "参考リンクを開く：{url}",
    "Mở {duong}":
      "{duong} を開く",
    "Mở {ten}":
      "{ten} を開く",
    "Nguồn dữ liệu được lấy từ các đường link của trang web":
      "データの出典はこちらのサイトのリンクです",
    "Ngày thi {ngay}":
      "試験日 {ngay}",
    "Nó chống được xoá nhầm và ghi hỏng, nhưng mất máy thì mất cả hai.":
      "誤削除や書き込み失敗からは守れますが、端末をなくせば両方とも失われます。",
    "Nộp bài":
      "提出する",
    "Phiên này: {n} lượt":
      "今回：{n} 回",
    "Quá hạn {n} ngày":
      "{n} 日遅れ",
    "Sai":
      "不正解",
    "Sai → Đúng":
      "不正解 → 正解",
    "Sát rồi, chỉ còn {n} bài nữa là đạt mục tiêu.":
      "あと少し、目標まで {n} 問です。",
    "Trong đó {n} bài đã quá hạn — nên ưu tiên làm trước.":
      "そのうち {n} 問は期限切れです——先に片づけましょう。",
    "Tất cả":
      "すべて",
    "Tất cả chủ đề ({n})":
      "すべての分野（{n}）",
    "Vì thế mình tạo ra công cụ này với mục đích giúp các bạn có thể ôn tập cho kỳ thi":
      "だからこの道具を作りました。皆さんが",
    "Ví dụ:":
      "例：",
    "Xong":
      "終了",
    "bạn chọn {chon} · đúng là {dung}":
      "選択 {chon} · 正解 {dung}",
    "còn {n}":
      "あと {n}",
    "của cả bốn môn, kèm link tới denken-ou.com và độ khó từng bài. Cứ làm bài, app sẽ tự xếp lịch ôn lại đúng lúc bạn sắp quên.":
      "4 科目すべての問題があり、denken-ou.com へのリンクと難易度も付いています。解いていけば、忘れかけた頃にアプリが復習を組んでくれます。",
    "không có đề":
      "問題なし",
    "làm sai":
      "不正解",
    "làm đúng":
      "正解",
    "mỗi môn.":
      "です。",
    "mở bài và bắt đầu tính giờ":
      "問題を開いて計時開始",
    "quá hạn {n}n":
      "{n} 日遅れ",
    "trên {tong} bài · {pt}%":
      "{tong} 問中 · {pt}%",
    "và sang":
      "そして次は",
    "và xếp lịch ôn lại. Vẫn đang ở bài này — cứ ghi chú thoải mái, chuyển bài lúc nào là quyền của bạn. Bấm nhầm thì chấm lại bằng nút kia.":
      "次の復習も予定しました。まだこの問題のままです——メモはゆっくりどうぞ。次に進むかはあなた次第です。押し間違えたら、もう一方のボタンで採点し直せます。",
    "{da} / {tong} bài":
      "{da} / {tong} 問",
    "{da}/{tong} bài đã làm":
      "{da}/{tong} 問 解答済み",
    "{dung}/{cham} ý":
      "{dung}/{cham} 設問",
    "{dung}/{tong} ý đúng":
      "{dung}/{tong} 設問 正解",
    "{ngay}: {n} bài":
      "{ngay}：{n} 問",
    "{nhan} — đúng {dung}, sai {sai}":
      "{nhan} — 正解 {dung}、不正解 {sai}",
    "{n} bài":
      "{n} 問",
    "{n} bài đến hạn ôn hôm nay":
      "今日復習する問題 {n} 問",
    "{n} bài/ngày":
      "1 日 {n} 問",
    "{n} bản":
      "{n} 件",
    "{n} câu":
      "{n} 問",
    "{n} ghi chú":
      "メモ {n} 件",
    "{n} huy hiệu":
      "バッジ {n} 個",
    "{n} link tham khảo":
      "参考リンク {n} 件",
    "{n} lần · bấm vào một lượt để xem phân tích từng câu":
      "{n} 回 · 1 件を押すと設問ごとの分析が見られます",
    "{n} phút":
      "{n} 分",
    "{n} phút →":
      "{n} 分 →",
    "{n} ý chưa có đáp án, không tính điểm":
      "{n} 設問は解答がなく、採点対象外です",
    "{n} đến hạn":
      "{n} 件が期限",
    "{trang}: {n}":
      "{trang}：{n}",
    "· {tong} bài, còn {con} bài chưa xử lý)":
      "· {tong} 問、残り {con} 問）",
    "Ôn lại {ngay}":
      "次の復習 {ngay}",
    "Ôn đúng lịch giúp nhớ lâu hơn nhiều so với học dồn.":
      "予定どおりの復習は、詰め込みよりずっと定着します。",
    "ý (B問題 mỗi câu 2 ý). Điểm sẽ được quy về thang 100 trên phần chấm được, số câu còn lại không tính là sai.":
      "設問（B問題は 1 問あたり 2 設問）。点数は採点できた分を 100 点満点に換算し、残りは不正解として数えません。",
    "Đang bật":
      "オン",
    "Đang làm sai ({n})":
      "いま不正解（{n}）",
    "Đang tính giờ":
      "計時中",
    "Đang tắt":
      "オフ",
    "Đang đồng bộ…":
      "同期中…",
    "Đánh dấu bài này là đáng chú ý":
      "この問題に「見返す価値あり」と印をつける",
    "Đánh dấu sao":
      "星つき",
    "Đánh dấu sao ({n})":
      "星つき（{n}）",
    "Đã có file Excel theo dõi từ trước?":
      "以前から Excel で管理していますか？",
    "Đã khôi phục dữ liệu từ bản sao lưu.":
      "バックアップからデータを復元しました。",
    "Đã nhân bản sang {duong}":
      "{duong} へ複製しました",
    "Đã nhân bản sang {duong} (chép thêm {n} file đính kèm).":
      "{duong} へ複製しました（添付ファイル {n} 件も一緒に）。",
    "Đã nhập dữ liệu từ Excel.":
      "Excel から取り込みました。",
    "Đã nhập {bai} bài: {gc} ghi chú, {link} link tham khảo, {lich} bài đang trong chu kỳ ôn.":
      "{bai} 問を取り込みました：メモ {gc} 件、参考リンク {link} 件、復習中 {lich} 問。",
    "Đã trả lời {da}/{can} ý":
      "{can} 設問中 {da} 設問 解答済み",
    "Đã xuất bản sao lưu: {duong}":
      "バックアップを書き出しました：{duong}",
    "Đã xuất file Excel: {duong}":
      "Excel ファイルを書き出しました：{duong}",
    "Đã xuất gói đầy đủ: {duong}":
      "フルパッケージを書き出しました：{duong}",
    "Đã đồng bộ":
      "同期済み",
    "Đính kèm file":
      "ファイルを添付",
    "Đúng":
      "正解",
    "Đúng {n}":
      "正解 {n}",
    "Đến hạn":
      "期限",
    "Đến hạn hôm nay ({n})":
      "今日が期限（{n}）",
    "Độ khó {n}/5":
      "難易度 {n}/5",
    "đúng {dung}/{tong} ý":
      "{tong} 設問中 {dung} 設問 正解",
    "đến hạn":
      "期限",
    "để xử lý hết {con} bài còn nợ ({chua} chưa làm + {sai} đang sai).":
      "残り {con} 問を片づけるため（未着手 {chua} 問 + 不正解 {sai} 問）。",
    "Ảnh đính kèm không đi theo — chỉ tiến độ, ghi chú, link và lịch sử thi.":
      "添付画像は同期されません——進捗・メモ・リンク・受験履歴だけです。",
    "— {cau} câu, {mon} môn":
      "— {cau} 問、{mon} 科目",
  },
};
