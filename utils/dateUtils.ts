/**
 * Calcula o tempo decorrido em horas úteis entre duas datas.
 * Considera: Segunda a Sexta, das 07:00 às 17:00 (10h por dia).
 */
export function getBusinessHoursElapsed(startDate: Date, endDate: Date): number {
  if (startDate > endDate) return 0;

  let elapsedMs = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Normaliza o início para não contar antes das 07:00 ou depois das 17:00 no dia de abertura
  // Se abrir antes das 7h, começa a contar às 7h
  if (current.getHours() < 7) {
    current.setHours(7, 0, 0, 0);
  }
  // Se abrir depois das 17h, começa a contar às 7h do próximo dia útil
  if (current.getHours() >= 17) {
    current.setDate(current.getDate() + 1);
    current.setHours(7, 0, 0, 0);
  }

  // Itera em passos de 30 minutos para precisão sem custo excessivo
  const stepMs = 30 * 60 * 1000;
  while (current < end) {
    const day = current.getDay();
    const hour = current.getHours();

    // 0 = Domingo, 6 = Sábado
    const isWeekend = day === 0 || day === 6;
    const isBusinessHour = hour >= 7 && hour < 17;

    if (!isWeekend && isBusinessHour) {
      elapsedMs += stepMs;
    }

    current.setTime(current.getTime() + stepMs);
  }

  return elapsedMs / (1000 * 60 * 60);
}
