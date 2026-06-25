import { useEffect, useState } from "react";

export interface TelemetryData {
  status: string;
  sonar: string;
}

export function useRobotTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    status: "DESCONECTADO",
    sonar: "0.00",
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = "http://localhost:3000/statusconnection";

    // Função assíncrona para buscar os dados na API REST
    async function fetchTelemetry() {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Erro na resposta do servidor");
        }

        // Espera o JSON estruturado do seu backend Node/TS (ex: { status: "LIVRE", sonar: "0.40" })
        const data = await response.json();
        
        setTelemetry({
          status: data.status || "DESCONHECIDO",
          sonar: data.sonar || "0.00",
        });
        setIsConnected(true);
      } catch (error) {
        console.error("Erro ao buscar telemetria via HTTP:", error);
        setIsConnected(false);
        setTelemetry((prev) => ({ ...prev, status: "DESCONECTADO" }));
      }
    }

    // 1. Executa uma vez imediatamente ao abrir a tela
    fetchTelemetry();

    // 2. Define o temporizador para rodar a cada 3000 milissegundos (3 segundos)
    const intervalId = setInterval(fetchTelemetry, 3000);

    // Limpa o temporizador se o usuário sair desta tela do front-end
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { telemetry, isConnected };
}