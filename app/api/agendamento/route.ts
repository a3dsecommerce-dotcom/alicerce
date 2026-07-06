import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { colaboradorId, colaboradorNome, dataAgendamento, horario, motivo } = await req.json();

    if (!colaboradorNome || !dataAgendamento || !horario) {
      return NextResponse.json({ error: "Nome, data e horário são obrigatórios." }, { status: 400 });
    }

    // 1. Insert into Supabase table agendamentos
    const { data: appointment, error: dbError } = await supabase
      .from("agendamentos")
      .insert([{
        colaborador_id: colaboradorId || null,
        colaborador_nome: colaboradorNome,
        data_agendamento: dataAgendamento,
        horario: horario,
        motivo: motivo || "Sem motivo informado",
        status: "Confirmado"
      }])
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating agendamento:", dbError);
      return NextResponse.json({ error: "Erro ao salvar agendamento no banco." }, { status: 500 });
    }

    // 2. Generate standard iCalendar .ics format on-the-fly
    const cleanDate = dataAgendamento.replace(/-/g, ""); // yyyymmdd
    const cleanTime = horario.replace(/:/g, ""); // hhmm
    const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    // End time is 1 hour after start time
    const startHour = parseInt(horario.split(":")[0]);
    const startMinute = horario.split(":")[1];
    const endHourStr = (startHour + 1).toString().padStart(2, "0");
    const endTime = `${endHourStr}${startMinute}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Alicerce//Agendamento Portal//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:appointment_${appointment.id}@alicerce.cloud`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${cleanDate}T${cleanTime}00`,
      `DTEND:${cleanDate}T${endTime}00`,
      `SUMMARY:Atendimento Escritório - ${colaboradorNome}`,
      `DESCRIPTION:Colaborador: ${colaboradorNome}\\nMotivo: ${motivo || 'Não informado'}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Lembrete de Atendimento",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    // 3. Send email invite via Nodemailer to Google Calendar email
    const mailUser = process.env.GOOGLE_CALENDAR_EMAIL;
    const mailPass = process.env.GOOGLE_CALENDAR_PASSWORD;

    if (mailUser && mailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: mailUser,
          pass: mailPass
        }
      });

      const mailOptions = {
        from: mailUser,
        to: mailUser, // Sending to yourself automatically registers the event in your Google Calendar
        subject: `Agendamento Escritório: ${colaboradorNome}`,
        text: `Olá!\n\nUm atendimento no escritório foi agendado por: ${colaboradorNome}\nData: ${dataAgendamento}\nHorário: ${horario}\nMotivo: ${motivo || 'Não informado'}.\n\nEste convite foi adicionado automaticamente ao seu Google Calendar.`,
        icalEvent: {
          filename: "invite.ics",
          method: "request",
          content: icsContent
        }
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Google Calendar invite sent successfully via email!");
    } else {
      console.warn("⚠️ Google Calendar credentials not found in env. Only saved to DB.");
    }

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    console.error("Error in agendamento API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
