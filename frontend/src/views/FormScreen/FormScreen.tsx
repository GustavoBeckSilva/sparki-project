import React, { useState, useEffect } from 'react';
import styles from './FormScreen.module.css';
import { SendMoveSequence } from '../../repository/MoveSequence';
import mqtt from 'mqtt'; // Importando a biblioteca MQTT

type Direction = 'esquerda' | 'frente' | 'direita' | 'tras';

export function FormScreen() {
  // --- CONTROLES DE NAVEGAÇÃO ---
  const [speed, setSpeed] = useState<number>(0.5); 
  const [duration, setDuration] = useState<number>(3.0);
  const [direction, setDirection] = useState<Direction>('frente');
  const [intensity, setIntensity] = useState<number>(0.5);
  
  const [status, setStatus] = useState<'idle' | 'moving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // --- NOVOS ESTADOS: TELEMETRIA MQTT ---
  const [isPathClear, setIsPathClear] = useState<boolean>(true);
  const [obstacleDistance, setObstacleDistance] = useState<string>("--");

  // --- EFEITO DE CONEXÃO MQTT EM TEMPO REAL ---
  useEffect(() => {
    // Conecta ao Broker via WebSocket (A porta padrão para WS no Mosquitto é a 9001)
    // Se o seu Mosquitto rodar em outra máquina, troque 'localhost' pelo IP dela.
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      console.log('✅ Dashboard conectado ao Broker MQTT (Telemetria Ativa)');
      // Assinando os tópicos que criamos no seu mqtt_bridge.py
      client.subscribe('sparki/telemetry/sonar');
      client.subscribe('sparki/telemetry/status');
    });

    client.on('message', (topic, message) => {
      const payload = message.toString();
      
      if (topic === 'sparki/telemetry/sonar') {
        setObstacleDistance(payload);
      } else if (topic === 'sparki/telemetry/status') {
        setIsPathClear(payload === 'LIVRE');
      }
    });

    // Desconecta ao fechar ou trocar de tela
    return () => {
      if (client) client.end();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trava de Segurança no Dashboard: Impede envio de comando frontal se houver obstáculo
    if (!isPathClear && direction === 'frente') {
      setStatus('error');
      setErrorMessage('Ação bloqueada: Há um obstáculo à frente!');
      setTimeout(() => setStatus('idle'), 3500);
      return;
    }

    setStatus('moving');
    setErrorMessage('');

    let finalLinear = 0.0;
    let finalAngular = 0.0;

    if (direction === 'frente') {
      finalLinear = speed;
    } else if (direction === 'tras') {
      finalLinear = -speed;
    } else if (direction === 'esquerda') {
      finalLinear = speed;
      finalAngular = intensity;
    } else if (direction === 'direita') {
      finalLinear = speed;
      finalAngular = -intensity;
    }

    const command = { linear: finalLinear, angular: finalAngular, duration };

    try {
      const response = await SendMoveSequence([command]);
      
      if (response.isSuccess) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(response.message || 'Colisão iminente detectada no trajeto!');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Erro de conexão com o sistema central do robô.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // --- LÓGICA DA ANIMAÇÃO DA INTERFACE ---
  let transY = 0;
  let rotDeg = 0;

  if (direction === 'frente') {
    transY = -(speed * duration * 120);
  } else if (direction === 'tras') {
    transY = (speed * duration * 120); 
  } else if (direction === 'esquerda' || direction === 'direita') {
    transY = -(speed * duration * 120);
    const signal = direction === 'esquerda' ? -1 : 1;
    rotDeg = (intensity * duration * 57.29) * signal;
  }

  const animationStyle: React.CSSProperties = {
    transform: status === 'moving' || status === 'success' || status === 'error'
      ? `rotate(${rotDeg}deg) translateY(${transY}px)` 
      : 'rotate(0deg) translateY(0px)',
    transition: status === 'moving' 
      ? `transform ${duration}s ease-in-out` 
      : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  return (
    <div className={styles.container}>
      {/* LADO ESQUERDO: CONTROLES E TELEMETRIA */}
      <div className={styles.formSection}>
        <h2 className={styles.title}>Painel de Navegação</h2>
        
        {/* INDICADOR DE STATUS MQTT EM TEMPO REAL */}
        <div className={styles.statusContainer}>
          <div className={styles.statusIndicator}>
            <div className={`${styles.dot} ${isPathClear ? styles.dotClear : styles.dotObstacle}`} />
            <span>{isPathClear ? "Pista Livre" : "OBSTÁCULO NA PISTA!"}</span>
          </div>
          <div className={styles.distanceBadge}>
            Sensor: {obstacleDistance} m
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className={styles.inputGroup}>
            <label>Direção</label>
            <div className={styles.directionButtons}>
              <button type="button" className={`${styles.dirBtn} ${direction === 'esquerda' ? styles.active : ''}`} onClick={() => setDirection('esquerda')}>↰ Esq</button>
              <button type="button" className={`${styles.dirBtn} ${direction === 'frente' ? styles.active : ''}`} onClick={() => setDirection('frente')}>↑ Frente</button>
              <button type="button" className={`${styles.dirBtn} ${direction === 'tras' ? styles.active : ''}`} onClick={() => setDirection('tras')}>↓ Trás</button>
              <button type="button" className={`${styles.dirBtn} ${direction === 'direita' ? styles.active : ''}`} onClick={() => setDirection('direita')}>↱ Dir</button>
            </div>
          </div>

          {(direction === 'esquerda' || direction === 'direita') && (
            <div className={styles.inputGroup}>
              <label>Força da Curva (Angular): {intensity.toFixed(1)} rad/s</label>
              <input 
                type="range" min="0.2" max="1.5" step="0.1" 
                value={intensity} 
                onChange={e => setIntensity(parseFloat(e.target.value))} 
                className={styles.slider}
              />
              <div className={styles.sliderLabels}>
                <span>Suave</span>
                <span>Agressiva</span>
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Aceleração (Linear): {speed.toFixed(1)} m/s</label>
            <input 
              type="range" min="0.0" max="1.0" step="0.1" 
              value={speed} 
              onChange={e => setSpeed(parseFloat(e.target.value))} 
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>0 (Parado)</span>
              <span>Média</span>
              <span>Máxima</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Tempo do Trajeto: {duration.toFixed(1)}s</label>
            <input 
              type="range" min="1.0" max="10.0" step="0.5" 
              value={duration} 
              onChange={e => setDuration(parseFloat(e.target.value))} 
              className={styles.slider}
            />
          </div>

          <button type="submit" disabled={status === 'moving'} className={styles.submitBtn}>
            {status === 'moving' ? 'Robô em movimento...' : 'Disparar Comando'}
          </button>
          
          {status === 'success' && <div className={`${styles.statusMessage} ${styles.success}`}>✅ Destino alcançado com sucesso!</div>}
          {status === 'error' && <div className={`${styles.statusMessage} ${styles.error}`}>⚠️ {errorMessage}</div>}
        </form>
      </div>

      {/* LADO DIREITO: ARENA DO ROBÔ */}
      <div className={styles.arena}>
        <div className={styles.robot} style={animationStyle}>
          <div className={styles.sonar}></div>
          <div className={styles.wheel} style={{ left: '-7px' }}></div>
          <div className={styles.wheel} style={{ right: '-7px' }}></div>
          <div className={styles.chassis}></div>
        </div>
      </div>
    </div>
  );
}