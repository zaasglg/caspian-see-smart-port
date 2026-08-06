import type { WeatherData } from '@/types/port';
import { PORT_CENTER, STORM_WIND_THRESHOLD } from '@/data/portData';

const FALLBACK: WeatherData = {
  windSpeed: 5.5,
  temp: 22,
  isSafe: true,
  isMock: true,
};

interface OpenMeteoResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
  };
}

export async function fetchAktauWeather(): Promise<WeatherData> {
  const [lat, lon] = PORT_CENTER;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return FALLBACK;
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current_weather;

    if (!current) {
      return FALLBACK;
    }

    // Open-Meteo returns windspeed in km/h — convert to m/s
    const windSpeedMs = Number((current.windspeed / 3.6).toFixed(1));
    const temp = Number(current.temperature.toFixed(1));

    return {
      windSpeed: windSpeedMs,
      temp,
      isSafe: windSpeedMs <= STORM_WIND_THRESHOLD,
      isMock: false,
    };
  } catch {
    return FALLBACK;
  }
}
