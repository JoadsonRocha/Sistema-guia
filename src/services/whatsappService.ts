import { supabaseService } from '../lib/supabaseService';

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  recipientName: string;
  customMessage: string;
  variables?: Record<string, string>;
}

export interface WaMeRecipientLink {
  id: string;
  name: string;
  phone: string;
  formattedPhone: string;
  interpolatedText: string;
  waMeUrl: string;
  status: 'pending' | 'sent';
}

class WhatsAppService {
  /**
   * Sanitiza e formata o número de telefone para o padrão internacional (E.164)
   * Exemplo: (95) 99123-4567 -> 5595991234567
   */
  public formatPhoneNumber(phone: string): string {
    let cleaned = (phone || '').replace(/\D/g, '');
    if (!cleaned) return '';
    
    // Strip leading zero if present (e.g. 095991234567 -> 95991234567)
    cleaned = cleaned.replace(/^0+/, '');
    
    // Se não tiver DDD (ex: 991234567), adiciona DDD padrão 95 (Roraima)
    if (cleaned.length === 8 || cleaned.length === 9) {
      cleaned = '95' + cleaned;
    }
    
    // Se não tiver código de país 55, adiciona
    if (!cleaned.startsWith('55') && (cleaned.length === 10 || cleaned.length === 11)) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Substitui tags dinâmicas no template da mensagem ({nome}, {bairro}, {lider})
   */
  public interpolateMessage(template: string, vars: Record<string, string>): string {
    let result = template || '';
    Object.keys(vars).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, vars[key] || '');
    });
    return result;
  }

  /**
   * Gera o link direto oficial do WhatsApp (wa.me / api.whatsapp.com) com texto pré-preenchido
   */
  public generateWaMeLink(phone: string, text: string): string {
    const formattedPhone = this.formatPhoneNumber(phone);
    const encodedText = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }

  /**
   * Prepara um lote de links de disparo assistido wa.me com interpolação de variáveis
   */
  public prepareWaMeBatch(
    recipients: Array<{ id?: string; name: string; phone: string; vars?: Record<string, string> }>,
    messageTemplate: string
  ): WaMeRecipientLink[] {
    return recipients.map((r, index) => {
      const name = r.name || 'Apoiador';
      const phone = r.phone || '';
      const formattedPhone = this.formatPhoneNumber(phone);
      const vars = { nome: name, ...(r.vars || {}) };
      const interpolatedText = this.interpolateMessage(messageTemplate, vars);
      const waMeUrl = this.generateWaMeLink(phone, interpolatedText);

      return {
        id: r.id || `rec_${index}_${Date.now()}`,
        name,
        phone,
        formattedPhone,
        interpolatedText,
        waMeUrl,
        status: 'pending'
      };
    });
  }

  /**
   * Grava histórico de disparo assistido no Firestore para controle da campanha
   */
  public async logDispatch(recipientName: string, phone: string, message: string) {
    try {
      await supabaseService.addDocument('whatsapp_logs', {
        recipientName,
        phone,
        message,
        method: 'wa.me_direct',
        sentAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Não foi possível gravar log no Firestore:', err);
    }
  }

  /**
   * Obtém as configurações da Evolution API salvas no localStorage
   */
  public getEvolutionCredentials() {
    const url = localStorage.getItem('nexus_evolution_url') || '';
    const apiKey = localStorage.getItem('nexus_evolution_apikey') || '';
    const instance = localStorage.getItem('nexus_evolution_instance') || '';
    return { url, apiKey, instance };
  }

  /**
   * Salva as configurações da Evolution API no localStorage
   */
  public setEvolutionCredentials(url: string, apiKey: string, instance: string) {
    localStorage.setItem('nexus_evolution_url', url || '');
    localStorage.setItem('nexus_evolution_apikey', apiKey || '');
    localStorage.setItem('nexus_evolution_instance', instance || '');
  }

  /**
   * Dispara uma mensagem de texto de forma automática usando a Evolution API
   */
  public async sendEvolutionMessage(phone: string, text: string): Promise<{ success: boolean; message?: string }> {
    const { url, apiKey, instance } = this.getEvolutionCredentials();
    if (!url || !apiKey || !instance) {
      return { success: false, message: 'Configurações da Evolution API incompletas. Preencha URL, Chave de API e Instância.' };
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone) {
      return { success: false, message: 'Número de telefone inválido.' };
    }

    // Normalizar a URL para evitar barra duplicada
    const baseUrl = url.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/message/sendText/${instance}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: text,
          delay: 1200,
          linkPreview: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Erro da API (${response.status}): ${errorText || 'Sem resposta.'}` };
      }

      const responseData = await response.json();
      return { success: true, message: responseData?.key?.id || 'Mensagem enviada!' };
    } catch (err: any) {
      return { success: false, message: `Falha de rede ou CORS ao conectar na API: ${err.message}` };
    }
  }
}

export const whatsappService = new WhatsAppService();
