/**
 * Quy chế thi 電験三種, chép từ tờ 受験票 và tờ hướng dẫn kèm theo.
 *
 * Đây là CODE chứ không phải dữ liệu người dùng: ai cài app cũng thấy giống
 * nhau, và cập nhật app là cập nhật luôn phần này. Đúng ranh giới code/dữ liệu
 * của cả dự án — xem README.
 *
 * Cố ý KHÔNG chứa bất cứ thứ gì của riêng một người: họ tên, địa chỉ, số báo
 * danh, ngày sinh, số điện thoại, tên hội trường. Những thứ đó nằm trên tờ
 * 受験票 của bạn, và repo này thì công khai.
 *
 * Nguyên văn tiếng Nhật giữ lại bên cạnh bản dịch: hôm thi giám thị đọc thông
 * báo bằng tiếng Nhật, và tờ giấy trên bàn cũng là tiếng Nhật.
 */

export interface LuatMuc {
  /** Nguyên văn tiếng Nhật. */
  ja: string;
  /** Bản dịch. */
  vi: string;
  /** Vi phạm là mất quyền thi, không có ngoại lệ. */
  nghiem?: boolean;
}

export interface LuatNhom {
  id: string;
  ja: string;
  vi: string;
  /** Câu dẫn ngắn, nói rõ vì sao mục này quan trọng. */
  dan?: string;
  muc: LuatMuc[];
}

/** Giờ thi từng môn, y như in trên tờ hướng dẫn. */
export const GIO_THI = [
  { mon: "理論", vi: "Lý thuyết", batDau: "9:15", ketThuc: "10:45" },
  { mon: "電力", vi: "Điện lực", batDau: "11:25", ketThuc: "12:55" },
  { mon: "機械", vi: "Máy điện", batDau: "14:15", ketThuc: "15:45" },
  { mon: "法規", vi: "Pháp quy", batDau: "16:25", ketThuc: "17:30" },
] as const;

export const LUAT: LuatNhom[] = [
  {
    id: "khong-duoc-thi",
    ja: "試験当日の特別注意事項",
    vi: "Bốn trường hợp KHÔNG được thi",
    dan:
      "下記の事項に該当する場合、理由のいかんにかかわらず受験できません。" +
      " — Rơi vào một trong bốn điều dưới đây là không được thi, lý do gì cũng không xét.",
    muc: [
      {
        ja: "遅刻（各科目の試験開始後30分を過ぎたら受験できません）",
        vi: "Đến muộn. Quá 30 phút kể từ giờ bắt đầu môn đó là hết quyền vào phòng.",
        nghiem: true,
      },
      {
        ja: "受験票を持っていない場合",
        vi: "Không mang theo 受験票 (phiếu dự thi).",
        nghiem: true,
      },
      {
        ja: "指定された試験会場以外での受験",
        vi: "Thi ở địa điểm khác với địa điểm đã ghi trên phiếu.",
        nghiem: true,
      },
      {
        ja: "受験票に記載されている受験者本人以外の受験",
        vi: "Người thi không phải người ghi trên phiếu.",
        nghiem: true,
      },
    ],
  },

  {
    id: "mang-gi",
    ja: "試験当日持参する物",
    vi: "Hôm thi mang theo gì",
    muc: [
      {
        ja: "筆記用具：HBの鉛筆又はシャープペンシル、鉛筆削り、プラスチック消しゴム、透明または半透明の定規、ルーペ",
        vi:
          "Bút viết: bút chì HB hoặc bút chì kim, gọt bút chì, tẩy nhựa, thước " +
          "trong hoặc mờ, kính lúp.",
      },
      {
        ja: "時計（通信機能を持つもの、アラームなど音が出るものは使用できません）",
        vi:
          "Đồng hồ — nhưng không được là loại có kết nối mạng, cũng không được " +
          "là loại kêu chuông báo.",
      },
      {
        ja: "電卓（開平計算（√）が必要になりますので、開平機能付きの電卓を使用するようにしてください）",
        vi:
          "Máy tính cầm tay. Đề có câu cần khai căn (√), nên phải chọn máy có " +
          "phím căn bậc hai.",
      },
      {
        ja: "写真付き身分証明書（運転免許証、パスポート、学生証（写真付）、マイナンバーカード等）",
        vi:
          "Giấy tờ tuỳ thân có ảnh: bằng lái, hộ chiếu, thẻ sinh viên có ảnh, " +
          "thẻ My Number… Có thể bị yêu cầu xuất trình để đối chiếu.",
      },
    ],
  },

  {
    id: "may-tinh",
    ja: "電卓使用に関する留意事項",
    vi: "Máy tính cầm tay — loại nào bị cấm",
    dan:
      "Dùng nhầm loại là bị tính gian lận (不正行為), chứ không phải chỉ bị nhắc nhở." +
      " Kiểm tra máy của bạn từ hôm nay, đừng để tới sáng hôm thi.",
    muc: [
      {
        ja: "数式が記憶できる電卓",
        vi: "Máy nhớ được công thức.",
        nghiem: true,
      },
      { ja: "関数電卓", vi: "Máy tính khoa học (loại có sin/cos/log).", nghiem: true },
      { ja: "印字機能を有する電卓", vi: "Máy có chức năng in.", nghiem: true },
      { ja: "電子パッド付き電卓", vi: "Máy gắn kèm bảng viết điện tử.", nghiem: true },
      { ja: "定規付き電卓", vi: "Máy gắn kèm thước.", nghiem: true },
      {
        ja: "試験中の電卓使用に際しては、音の鳴動がないようにしてください。",
        vi: "Máy phải tắt tiếng bấm phím.",
      },
    ],
  },

  {
    id: "trong-phong",
    ja: "試験受験上の注意",
    vi: "Trong phòng thi",
    muc: [
      {
        ja: "試験中は係員の指示に従ってください。指示に従わないときは退場となります。",
        vi: "Làm theo hướng dẫn của giám thị. Không nghe theo là bị mời ra khỏi phòng.",
        nghiem: true,
      },
      {
        ja: "試験当日は、各科目の試験開始20分前までに試験会場（試験室）に集合してください。",
        vi: "Có mặt trong phòng trước giờ bắt đầu mỗi môn 20 phút.",
      },
      {
        ja: "答案用紙（マークシート）は、必ず監督員に提出して退場してください。",
        vi: "Phải nộp phiếu trả lời cho giám thị rồi mới được rời phòng.",
      },
      {
        ja: "携帯電話、スマートウォッチ等の通信機器は使用できません。（試験会場では必ず電源を切り、カバン等にしまうこと）",
        vi:
          "Điện thoại, đồng hồ thông minh và mọi thiết bị có kết nối: tắt nguồn " +
          "hẳn và cất vào cặp. Không phải để im lặng — tắt nguồn.",
        nghiem: true,
      },
      {
        ja: "色鉛筆、下敷き、参考書類、計算尺、コンパス等は、試験時間中は一切使用できません。",
        vi:
          "Bút chì màu, tấm lót, tài liệu tham khảo, thước tính, compa — cấm " +
          "hoàn toàn trong suốt giờ thi.",
      },
      {
        ja: "この受験票は試験開始時に、机上に置き、試験開始後に回収に来る係員に提出してください。",
        vi:
          "Đặt phiếu dự thi lên mặt bàn khi bắt đầu; giám thị sẽ đi thu sau khi " +
          "tính giờ.",
      },
      {
        ja: "試験会場内では、大きな声を出したり、知人・友人の間で雑談するなど、不要な会話はお控えください。",
        vi: "Không nói to, không tán gẫu với bạn bè trong khu vực thi.",
      },
    ],
  },

  {
    id: "di-lai",
    ja: "会場までの移動",
    vi: "Đi lại và khu vực thi",
    muc: [
      {
        ja: "試験会場までは、公共交通機関を利用して来てください。",
        vi:
          "Đi bằng phương tiện công cộng. Đỗ xe ngoài đường hoặc ở cửa hàng gần " +
          "hội trường đã từng gây rắc rối.",
      },
      {
        ja: "試験会場においては、試験会場内及びその周辺で全面禁煙の場合もあります。",
        vi: "Nhiều hội trường cấm hút thuốc toàn bộ khuôn viên và khu vực quanh đó.",
      },
      {
        ja: "節電対策により、試験会場によってはエレベーター等の使用ができない場合があります。",
        vi: "Có nơi tắt thang máy để tiết kiệm điện — tính trước thời gian leo bộ.",
      },
    ],
  },

  {
    id: "suc-khoe",
    ja: "試験室における注意事項",
    vi: "Sức khoẻ và khẩu trang",
    muc: [
      {
        ja: "マスクの着用については、個人の主体的な選択を尊重し、個人の判断に委ねることとしています。",
        vi:
          "Đeo khẩu trang hay không là tuỳ bạn. Nhưng hội trường có quyền yêu cầu " +
          "đeo, và lúc đối chiếu ảnh thì giám thị có thể yêu cầu bạn tháo ra.",
      },
      {
        ja: "体調がすぐれない場合は速やかに係員にお知らせください。",
        vi:
          "Thấy trong người không ổn thì báo giám thị ngay. Tuỳ tình hình, họ có " +
          "thể yêu cầu dừng thi hoặc về nhà.",
      },
      {
        ja: "発熱症状などの症状のある方や健康に不安がある方は、受験をご遠慮ください。",
        vi: "Đang sốt hoặc thấy sức khoẻ bất ổn thì nên bỏ kỳ này.",
      },
    ],
  },

  {
    id: "canh-giac",
    ja: "試験結果を装った勧誘にご注意",
    vi: "Cảnh giác sau khi thi",
    muc: [
      {
        ja:
          "試験会場周辺で、試験結果を通知すると装って受験者を勧誘し会員を募る業者や、" +
          "関係団体を装って講習会等の勧誘を行う業者がいます。当試験センターとは一切関係がありません。",
        vi:
          "Quanh hội trường có người giả danh ban tổ chức, nói sẽ báo kết quả thi " +
          "để mời bạn vào hội viên hoặc bán khoá học. Trung tâm khảo thí không " +
          "liên quan gì tới họ.",
      },
      {
        ja: "試験結果発表日には、パソコンと携帯電話から合格者の受験番号を検索できます。",
        vi:
          "Ngày công bố kết quả, tự tra số báo danh trên trang của trung tâm bằng " +
          "máy tính hoặc điện thoại.",
      },
    ],
  },
];

/** Trang chính thức, nơi tải sơ đồ hội trường và tra kết quả. */
export const TRANG_CHINH_THUC = "https://www.shiken.or.jp/";
