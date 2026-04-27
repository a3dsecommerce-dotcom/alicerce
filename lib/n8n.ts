/**
 * Serviço de Integração com n8n (Alicerce Cognitive ERP)
 * Centraliza todas as chamadas para os webhooks do n8n.
 */

const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://n8n.alicerce.cloud/webhook";

export const n8n = {
  /**
   * Envia um gatilho genérico para um workflow do n8n.
   */
  async trigger(endpoint: string, payload: any) {
    try {
      const response = await fetch(`${N8N_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao comunicar com n8n:", error);
      return null;
    }
  },

  /**
   * Solicita a geração de um relatório PDF ao n8n
   */
  async gerarRelatorio(tipo: 'EPI' | 'ROTA' | 'OCORRENCIA' | 'REQUISICAO', dados: any) {
    // Esse webhook no n8n deve receber os dados, gerar um PDF e retornar a URL
    return this.trigger('gerar-pdf', { tipo, dados });
  },

  /**
   * Dispara um aviso no WhatsApp via n8n
   */
  async notificarWhatsApp(telefone: string, mensagem: string) {
    return this.trigger('notificacao-wpp', { telefone, mensagem });
  }
};
