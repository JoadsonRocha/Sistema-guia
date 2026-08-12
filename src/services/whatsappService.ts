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
}

export const whatsappService = new WhatsAppService();
