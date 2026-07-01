#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="ros2-edge-dev"
CONTAINER_NAME="edge"

echo "=========================================="
echo " 1. A construir a Imagem Docker (se necessário)..."
echo "=========================================="
docker build -t "${IMAGE_NAME}" "${SCRIPT_DIR}"

echo "=========================================="
echo " 2. A iniciar o Contentor Sparki Edge..."
echo "=========================================="
# Comando simplificado sem as configurações de interface gráfica.
# A flag --net=host expõe automaticamente as portas 1883, 9001, 9090 e 8888 para a sua rede local.
docker run -it \
    --name "${CONTAINER_NAME}" \
    --rm \
    --privileged \
    --net=host \
    --volume="${SCRIPT_DIR}/src:/root/ros2_ws/src" \
    "${IMAGE_NAME}"