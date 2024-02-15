export const calculateDaysBetweenDates = (
  startDate: Date,
  endDate: Date,
): number => {
  // Bir günün milisaniye cinsinden değeri
  const oneDay = 1000 * 60 * 60 * 24;

  // Tarihlerin zaman damgalarını alıp farkını alıyoruz
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  const difference = startTimestamp - endTimestamp;

  // Farkı bir güne böleriz ve yuvarlayarak gün sayısını buluruz
  const daysDifference = Math.round(difference / oneDay);

  return daysDifference;
};

export const calculateMonthsBetweenDates = (
  startDate: Date,
  endDate: Date,
): number => {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  // Başlangıç yılından itibaren geçen ay sayısı
  const monthsSinceStartYear = (endYear - startYear) * 12;

  // Toplam ay sayısını hesapla
  const totalMonths = monthsSinceStartYear + (endMonth - startMonth);

  return totalMonths;
};
