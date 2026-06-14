import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { attempts: number; blockedUntil: number }>();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const now = Date.now();

    // Check rate limit
    const rl = rateLimitStore.get(ip);
    if (rl && rl.blockedUntil > now) {
      const minLeft = Math.ceil((rl.blockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Muitas tentativas. Aguarde ${minLeft} minuto(s).` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { telefone, senha } = body;

    if (!telefone || !senha) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const telLimpo = String(telefone).replace(/\D/g, '');
    const telCom55 = telLimpo.startsWith('55') ? telLimpo : `55${telLimpo}`;
    const telSem55 = telLimpo.startsWith('55') ? telLimpo.slice(2) : telLimpo;

    // Find user
    let { data: user } = await supabase
      .from('usuarios')
      .select('*')
      .or(`telefone.eq.${telCom55},telefone.eq.${telSem55},telefone.eq.${telCom55}@s.whatsapp.net,telefone.eq.${telSem55}@s.whatsapp.net`)
      .single();

    // Fallback to unidades (Diretores)
    if (!user) {
      const { data: unitData } = await supabase
        .from('unidades')
        .select('*')
        .or(`responsavel_telefone.eq.${telCom55},responsavel_telefone.eq.${telSem55},responsavel_telefone.eq.${telefone},telefone.eq.${telCom55},telefone.eq.${telSem55}`)
        .single();

      if (unitData) {
        user = {
          id: `diretor_${unitData.id}`,
          nome: unitData.diretor || unitData.responsavel_nome || 'Diretor Unidade',
          telefone: unitData.responsavel_telefone || unitData.telefone,
          nivel_acesso: 2,
          cargo: 'DIRETOR_UNIDADE',
          unidade_alocacao: unitData.nome,
          secretaria: unitData.secretaria || 'SEMED',
          is_virtual: true,
        } as any;
      }
    }

    if (!user) {
      recordFailedAttempt(ip, rateLimitStore, now);
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // Validate password
    const senhaPadrao = telLimpo.slice(-4);
    const senhaCorreta = (user as any).senha || senhaPadrao;

    if (senha !== senhaCorreta) {
      const blocked = recordFailedAttempt(ip, rateLimitStore, now);
      if (blocked) {
        return NextResponse.json(
          { error: 'Conta bloqueada por 10 minutos após múltiplas tentativas incorretas.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: (user as any).senha ? 'Senha incorreta.' : 'Senha incorreta — use os 4 últimos dígitos.' },
        { status: 401 }
      );
    }

    // Success: clear rate limit
    rateLimitStore.delete(ip);

    // Resolve cargo
    const rawFuncao = (user as any).cargo ? String((user as any).cargo).toUpperCase() : null;
    const cargoResolvido = rawFuncao || (
      (user as any).nivel_acesso >= 4 ? 'ADMIN' :
      (user as any).nivel_acesso >= 3 ? 'GERENTE' :
      (user as any).nivel_acesso >= 2 ? 'SUPERVISOR' : 'COLABORADOR'
    );

    const isDefaultPassword = !(user as any).senha;

    return NextResponse.json({
      user: {
        id: (user as any).id,
        email: (user as any).telefone,
        telefone: (user as any).telefone,
        role: cargoResolvido,
        name: (user as any).nome,
        nivel: (user as any).nivel_acesso || 1,
        nivel_acesso: (user as any).nivel_acesso || 1,
        unidade_alocacao: (user as any).unidade_alocacao,
        secretaria: (user as any).secretaria,
        funcao: (user as any).cargo,
      },
      isDefaultPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno.' }, { status: 500 });
  }
}

function recordFailedAttempt(
  ip: string,
  store: Map<string, { attempts: number; blockedUntil: number }>,
  now: number
): boolean {
  const current = store.get(ip) || { attempts: 0, blockedUntil: 0 };
  current.attempts += 1;
  if (current.attempts >= 5) {
    current.blockedUntil = now + 10 * 60 * 1000;
    current.attempts = 0;
    store.set(ip, current);
    return true;
  }
  store.set(ip, current);
  return false;
}
