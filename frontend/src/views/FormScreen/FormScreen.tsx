import React, { useState } from 'react';
import styles from './FormScreen.module.css';
import { SendMoveSequence } from '../../repository/MoveSequence';

type Direction = 'esquerda' | 'frente' | 'direita' | 'tras';

export function FormScreen() {
  // O slider linear agora é apenas "Velocidade Absoluta" (0.0 a 1.0)
  const [speed, setSpeed] = useState<number>(0.5); 
  const [duration, setDuration] = useState<number>(3.0);
  const [direction, setDirection] = useState<Direction>('frente');
  const [intensity, setIntensity] = useState<number>(0.5);
  
  const [status, setStatus] = useState<'idle' | 'moving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('moving');
    setErrorMessage('');

    // Lógica correta de Direção x Aceleração
    let finalLinear = 0.0;
    let finalAngular = 0.0;

    if (direction === 'frente') {
      finalLinear = speed;
    } else if (direction === 'tras') {
      finalLinear = -speed; // Aplica a marcha-atrás aqui!
    } else if (direction === 'esquerda') {
      finalLinear = speed; // Se speed for 0, o robô faz pião no lugar
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
        setErrorMessage(response.message || 'Obstáculo detetado!');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Erro ao conectar com o robô.');
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // --- LÓGICA MATEMÁTICA DA ANIMAÇÃO (Física Real) ---
  // Calculamos as variáveis com base no que vai acontecer na vida real!
  
  // 1. Distância Total: Velocidade (m/s) * Tempo (s)
  // Vamos assumir que 1 metro = 120 pixels na nossa ecrã
  let transY = 0;
  let rotDeg = 0;

  if (direction === 'frente') {
    transY = -(speed * duration * 120);
  } else if (direction === 'tras') {
    transY = (speed * duration * 120); // Move para baixo
  } else if (direction === 'esquerda' || direction === 'direita') {
    // Curva ou Rotação no lugar
    transY = -(speed * duration * 120);
    
    // Rotação Total: Velocidade Angular (rad/s) * Tempo (s) = Radianos totais
    // 1 Radiano = ~57.29 graus. O CSS roda no sentido horário (positivo), mas o ROS roda no sentido anti-horário (positivo).
    const signal = direction === 'esquerda' ? -1 : 1;
    rotDeg = (intensity * duration * 57.29) * signal;
  }

  // O Segredo de CSS para Curvas: Rodar o eixo primeiro (rotate), e depois andar no novo eixo (translateY)
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
      {/* LADO ESQUERDO: CONTROLES */}
      <div className={styles.formSection}>
        <h2 className={styles.title}>Painel de Navegação</h2>
        
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

          {/* Só mostra a intensidade se for uma curva */}
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
            {/* O Slider de Velocidade agora é estritamente positivo (0 a 1) */}
            <label>Aceleração (Linear): {speed.toFixed(1)} m/s</label>
            <input 
              type="range" min="0.0" max="1.0" step="0.1" 
              value={speed} 
              onChange={e => setSpeed(parseFloat(e.target.value))} 
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>0 (Pião / Parado)</span>
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