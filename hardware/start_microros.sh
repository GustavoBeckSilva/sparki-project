set -e

echo "=========================================="
echo " 1. Configurando o Firewall (Porta 8888 UDP)"
echo "=========================================="

sudo ufw allow 8888/udp
echo "Porta 8888/udp liberada com sucesso!"
echo ""

echo "=========================================="
echo " 2. Iniciando o Micro-ROS Agent (Docker)..."
echo " Pressione Ctrl+C para encerrar."
echo "=========================================="

docker run -it --rm --net=host microros/micro-ros-agent:humble udp4 --port 8888