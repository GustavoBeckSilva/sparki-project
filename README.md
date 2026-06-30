# Sparki

> Projeto de estudo de movimentação 2D de veículos semi-autônomos indoor.

O Sparki é um sistema modular de robótica dividido em quatro camadas: **Hardware** (ESP32/Vespa), **Edge** (ROS 2 Humble), **Backend** (Node.js/TypeScript) e **Frontend**. O robô simula ambientes no Gazebo, realiza mapeamento de espaços e conta com um sistema robusto de controle e prevenção de colisões.

![ROS 2](https://img.shields.io/badge/ROS_2-Humble-blue?logo=ros)
![Node.js](https://img.shields.io/badge/Node.js-TypeScript-3178c6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker)
![PlatformIO](https://img.shields.io/badge/PlatformIO-ESP32-FF7F00?logo=platformio)

---

## Sumário

- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como Executar](#como-executar)
  - [Edge](#1-edge)
  - [Backend](#2-backend)
  - [Hardware](#3-hardware)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)

---

## Arquitetura

O sistema é composto por quatro camadas que se comunicam de forma isolada e bem definida:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼──────────────────────────────┐
│              Backend  (Node.js / TS)                │
│         Traduz REST → Serviços ROS 2                │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket (rosbridge :9090)
┌──────────────────────▼──────────────────────────────┐
│          Edge  (Docker · ROS 2 Humble)              │
│   Gazebo · Rviz2 · Controlador · Anticolisão        │
└──────────────────────┬──────────────────────────────┘
                       │ Micro-ROS UDP :8888  /cmd_vel
┌──────────────────────▼──────────────────────────────┐
│           Hardware  (ESP32 Vespa · RoboCore)        │
│         Interpreta /cmd_vel → motores               │
└─────────────────────────────────────────────────────┘
```

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| **Hardware** | ESP32 Vespa + micro_ros_platformio | Escuta `/cmd_vel` e aciona os motores |
| **Edge** | ROS 2 Humble (Docker) | Simulação, mapeamento, controle e anticolisão |
| **Backend** | Node.js + Express + roslib | API REST que abstrai a comunicação com o ROS |
| **Frontend** | — | Interface para envio de comandos e visualização |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js](https://nodejs.org/) v18 ou superior
- [PlatformIO](https://platformio.org/) — necessário apenas para compilar o firmware do ESP32

---

## Como Executar

### 1. Edge

O Edge roda dentro de um container Docker com Ubuntu e ROS 2 Humble para evitar conflitos de ambiente.

```bash

./start_docker.sh

docker exec -it edge bash

./init_system.sh
```

> O script `init_system.sh` compila o workspace, inicia o Gazebo, ativa a ponte rosbridge na porta `9090` e sobe o nó controlador central.

---

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Quando o servidor estiver pronto, o terminal exibirá uma confirmação de que a API está rodando e conectada ao ROS 2 via rosbridge.

---

### 3. Hardware

Necessário apenas para operar o robô físico em vez da simulação.

```bash

sudo ufw allow 8888/udp

./hardware/start_microros.sh

# Compile e faça upload do firmware via PlatformIO
# Abra hardware/src/main.cpp no VS Code com a extensão PlatformIO e clique em Upload
```

---

## Endpoints da API

Todos os endpoints aceitam e retornam `application/json`.

---

### `POST /move`

Movimenta o robô em linha reta por uma distância em metros. Verifica colisões antes e durante o deslocamento.

**Corpo da requisição**
```json
{
  "distance": 1.5
}
```

**Exemplo**
```bash
curl -X POST http://localhost:3000/move \
  -H "Content-Type: application/json" \
  -d '{"distance": 1.5}'
```

**Resposta**
```json
{
  "success": true,
  "message": "Movimento concluído com sucesso."
}
```

---

### `POST /move_sequence`

Executa uma sequência de movimentos. Cada comando especifica velocidade linear, angular e duração.

**Corpo da requisição**
```json
{
  "commands": [
    { "linear": 0.2, "angular": 0.0, "duration": 2.0 },
    { "linear": 0.0, "angular": 0.5, "duration": 1.0 },
    { "linear": 0.2, "angular": 0.0, "duration": 2.0 }
  ]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `linear` | `number` | Velocidade linear em m/s |
| `angular` | `number` | Velocidade angular em rad/s |
| `duration` | `number` | Duração do comando em segundos |

**Exemplo**
```bash
curl -X POST http://localhost:3000/move_sequence \
  -H "Content-Type: application/json" \
  -d '{"commands": [{"linear": 0.2, "angular": 0.0, "duration": 2.0}]}'
```

---

### `POST /navigate`

Realiza navegação autônoma por coordenadas ou waypoints nomeados utilizando o mapa gerado.

**Corpo da requisição**
```json
{
  "waypoint": "sala_1"
}
```

---

## Estrutura do Projeto

```
sparki/
├── edge/        
│   ├── src/
│   └── init_system.sh
├── backend/              
│   ├── src/
│   └── package.json
├── hardware/              
│   ├── src/main.cpp
│   └── start_microros.sh
├── start_docker.sh
└── README.md
```

---

## Tecnologias

| Área | Tecnologia |
|------|-----------|
| Robótica | ROS 2 Humble (C++ e Python) |
| Simulação | Gazebo, Rviz2 |
| Containerização | Docker |
| Backend | Node.js, Express, TypeScript |
| Comunicação ROS↔API | Roslibjs, Rosbridge Server (WebSocket) |
| Firmware | PlatformIO, Arduino (C++ para ESP32 Vespa) |
