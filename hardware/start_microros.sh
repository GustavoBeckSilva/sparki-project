#!/usr/bin/env bash
set -euo pipefail

PORT="${MICROROS_PORT:-8888}"
IMAGE="${MICROROS_IMAGE:-microros/micro-ros-agent:humble}"
OS="$(uname -s)"

echo "=========================================="
echo " 1. Configurando rede (Porta ${PORT} UDP)"
echo "=========================================="

if [[ "${OS}" == "Linux" ]]; then
  if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow "${PORT}/udp"
    echo "Porta ${PORT}/udp liberada no ufw."
  else
    echo "ufw nao encontrado; pulando configuracao de firewall."
  fi
elif [[ "${OS}" == "Darwin" ]]; then
  echo "macOS detectado; ufw nao e usado aqui."
  echo "Se o Firewall do macOS bloquear, libere o Docker Desktop nas configuracoes do sistema."
else
  echo "Sistema ${OS} detectado; pulando configuracao automatica de firewall."
fi
echo ""

echo "=========================================="
echo " 2. Iniciando o Micro-ROS Agent (Docker)..."
echo " Pressione Ctrl+C para encerrar."
echo "=========================================="

if [[ "${OS}" == "Linux" ]]; then
  docker run -it --rm --net=host "${IMAGE}" udp4 --port "${PORT}" -v6
else
  docker run -it --rm -p "${PORT}:${PORT}/udp" "${IMAGE}" udp4 --port "${PORT}" -v6
fi
