/**
 * geoService.ts
 * Helper utility for capturing browser GPS location and reverse-geocoding coordinates into addresses.
 */

export interface GeoLocationResult {
  lat: number;
  lng: number;
  address?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
}

export async function getGPSLocation(): Promise<GeoLocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error("Geolocalização (GPS) não é suportada neste navegador ou dispositivo."));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let address = '';
        let road = '';
        let suburb = '';
        let city = '';
        let state = '';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data) {
              address = data.display_name || '';
              const addr = data.address || {};
              road = addr.road || addr.pedestrian || '';
              suburb = addr.suburb || addr.neighbourhood || addr.quarter || '';
              city = addr.city || addr.town || addr.municipality || '';
              state = addr.state || '';
            }
          }
        } catch (err) {
          console.warn("Reverse geocode fallback notification:", err);
        }

        resolve({
          lat,
          lng,
          address,
          road,
          suburb,
          city,
          state
        });
      },
      (error) => {
        let msg = "Não foi possível capturar a localização por GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Permissão de GPS negada. Por favor, permita o acesso à localização no seu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Sinal de GPS indisponível no momento.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Tempo limite para captura de GPS esgotado.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  });
}
