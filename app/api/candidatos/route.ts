import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { nome, telefone, cargo, link_curriculo } = body;

    if (!nome || !telefone || !cargo) {
      return NextResponse.json(
        { error: "Nome, telefone e cargo são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("candidatos")
      .insert([
        {
          nome,
          telefone,
          cargo,
          link_curriculo,
          status: "NOVO"
        }
      ])
      .select();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar no banco de dados." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
