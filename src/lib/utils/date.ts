import moment from "moment-timezone";

// 한국 시간대 상수
const KOREAN_TIMEZONE = "Asia/Seoul";

// 1️⃣ 기본 포맷 (현재 사용)
export const formatDate = (date: Date | string) => {
  return moment(date).tz(KOREAN_TIMEZONE).format("YYYY-MM-DD HH:mm");
  // 결과: 2024-06-04 14:30 (KST)
};

// 2️⃣ 한국어 형식
export const formatDateKorean = (date: Date | string) => {
  return moment(date).tz(KOREAN_TIMEZONE).format("YYYY년 MM월 DD일 A hh:mm");
  // 결과: 2024년 06월 04일 오후 02:30 (KST)
};

// 3️⃣ 상대적 시간 표시
export const formatDateRelative = (date: Date | string) => {
  return moment(date).tz(KOREAN_TIMEZONE).fromNow();
  // 결과: 2시간 전, 3일 전, 한달 전 (KST 기준)
};

// 4️⃣ 더 자세한 포맷
export const formatDateDetailed = (date: Date | string) => {
  return moment(date)
    .tz(KOREAN_TIMEZONE)
    .format("YYYY년 MM월 DD일 dddd A hh:mm:ss");
  // 결과: 2024년 06월 04일 화요일 오후 02:30:15 (KST)
};

// 5️⃣ 짧은 포맷
export const formatDateShort = (date: Date | string) => {
  return moment(date).tz(KOREAN_TIMEZONE).format("MM/DD HH:mm");
  // 결과: 06/04 14:30 (KST)
};

// 6️⃣ ISO 형식
export const formatDateISO = (date: Date | string) => {
  return moment(date).tz(KOREAN_TIMEZONE).format("YYYY-MM-DDTHH:mm:ss");
  // 결과: 2024-06-04T14:30:15 (KST)
};

// 7️⃣ 조건부 포맷 (오늘/어제/그 외)
export const formatDateConditional = (date: Date | string) => {
  const momentDate = moment(date).tz(KOREAN_TIMEZONE);
  const now = moment().tz(KOREAN_TIMEZONE);

  if (momentDate.isSame(now, "day")) {
    return `오늘 ${momentDate.format("HH:mm")}`;
  } else if (momentDate.isSame(now.clone().subtract(1, "day"), "day")) {
    return `어제 ${momentDate.format("HH:mm")}`;
  } else if (momentDate.isSame(now, "year")) {
    return momentDate.format("MM월 DD일 HH:mm");
  } else {
    return momentDate.format("YYYY년 MM월 DD일");
  }
  // 결과: 오늘 14:30, 어제 14:30, 06월 04일 14:30, 2023년 06월 04일 (KST 기준)
};
