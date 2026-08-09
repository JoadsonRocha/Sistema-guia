/**
 * @file geoService.ts
 * @description Serviço auxiliar de Geolocalização (GPS) para captura de coordenadas geográficas
 * e tradução automática para endereço legível (reverse geocoding) via OpenStreetMap Nominatim.
 *
 * Utilização:
 *   - Formulário de cadastro de eleitores (endereço preenchido automaticamente pelo GPS)
 *   - Formulário de agendamento de eventos (localização do ponto de campanha)
 */

/**
 * Estrutura de retorno da função de geolocalização.
 */
export interface GeoLocationResult {
  /** Latitude capturada pelo GPS */
  lat: number;
  /** Longitude capturada pelo GPS */
  lng: number;
  /** Endereço completo retornado pelo Nominatim (ex: "Rua XV de Novembro, Centro, Boa Vista - RR") */
  address?: string;
  /** Rua / logradouro */
  road?: string;
  /** Bairro ou subdivisão urbana */
  suburb?: string;
  /** Cidade ou município */
  city?: string;
  /** Estado */
  state?: string;
}

/**
 * Captura a localização atual do dispositivo via GPS do navegador e converte
 * as coordenadas geográficas em endereço legível usando a API pública do
 * OpenStreetMap Nominatim (reverse geocoding — sem custo, sem chave de API).
 *
 * @returns {Promise<GeoLocationResult>} Objeto com latitude, longitude e endereço detalhado.
 * @throws {Error} Se a permissão de GPS for negada, o sinal estiver indisponível ou o timeout for excedido.
 *
 * @example
 * const loc = await getGPSLocation();
 * console.log(loc.address); // "Av. Caramuru, 1234, Caçari, Boa Vista - RR, Brasil"
 */
export async function getGPSLocation(): Promise<GeoLocationResult> {
  return new Promise((resolve, reject) => {
    // Verificar se o navegador ou ambiente suporta a API de Geolocalização
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error("Geolocalização (GPS) não é suportada neste navegador ou dispositivo."));
    }

    // Iniciar captura de posição com alta precisão (GPS de satélite quando disponível)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Variáveis de endereço preenchidas pelo reverse geocoding
        let address = '';
        let road = '';
        let suburb = '';
        let city = '';
        let state = '';

        try {
          // Requisição ao Nominatim para converter coordenadas em endereço legível
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data) {
              // Endereço completo formatado pelo Nominatim
              address = data.display_name || '';

              // Extração de campos específicos do objeto address retornado
              const addr = data.address || {};
              road    = addr.road       || addr.pedestrian || '';
              suburb  = addr.suburb     || addr.neighbourhood || addr.quarter || '';
              city    = addr.city       || addr.town || addr.municipality || '';
              state   = addr.state      || '';
            }
          }
        } catch (err) {
          // Falha silenciosa no reverse geocoding — coordenadas ainda são retornadas
          console.warn("Aviso: Reverse geocoding indisponível, retornando apenas coordenadas GPS:", err);
        }

        // Retornar todos os dados capturados
        resolve({ lat, lng, address, road, suburb, city, state });
      },

      // Tratamento de erros de GPS com mensagens claras em português
      (error) => {
        let msg = "Não foi possível capturar a localização por GPS.";

        if (error.code === error.PERMISSION_DENIED) {
          // Usuário negou a permissão de localização no navegador
          msg = "Permissão de GPS negada. Por favor, permita o acesso à localização no seu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          // Sinal GPS indisponível (área sem cobertura, GPS desligado)
          msg = "Sinal de GPS indisponível no momento.";
        } else if (error.code === error.TIMEOUT) {
          // Tempo limite de 12 segundos esgotado sem retorno do GPS
          msg = "Tempo limite para captura de GPS esgotado.";
        }

        reject(new Error(msg));
      },

      {
        enableHighAccuracy: true, // Força uso de GPS de satélite (maior precisão, mais bateria)
        timeout: 12000,           // Aguardar até 12 segundos pela resposta do GPS
        maximumAge: 0             // Nunca usar posição em cache — sempre capturar nova leitura
      }
    );
  });
}
