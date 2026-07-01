#!/bin/bash

# 1. Carrega o ROS base
source /opt/ros/humble/setup.bash

# Armadilha: Quando premir Ctrl+C, fecha tudo de forma segura
trap "echo 'A encerrar todos os sistemas...'; kill 0" EXIT

echo "=========================================="
echo " 1. A compilar o Workspace..."
echo "=========================================="
cd /root/ros2_ws
colcon build --symlink-install

# 2. Carrega o projeto recém-compilado
source /root/ros2_ws/install/setup.bash

echo "=========================================="
echo " 2. A iniciar o Mapa (Localização)..."
echo "=========================================="
ros2 launch sparki_core amcl_localization.launch.py &

echo "=========================================="
echo " 3. A iniciar a Ponte de Comunicação (WebSocket ROS)..."
echo "=========================================="
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &

# Espera a ponte ligar
sleep 3

echo "=========================================="
echo " 4. A configurar e iniciar o Broker MQTT (Mosquitto)..."
echo "=========================================="
# Cria o ficheiro de configuração com WebSockets ativados
cat <<EOF > /tmp/mosquitto.conf
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
EOF

# Inicia o broker a apontar para a configuração criada
mosquitto -c /tmp/mosquitto.conf -d

echo "=========================================="
echo " 5. A iniciar os Módulos do Robô..."
echo "=========================================="
ros2 run sparki_core collision_detector &
ros2 run sparki_core mqtt_bridge &
ros2 run sparki_core controller &

echo "=========================================="
echo " ✅ Todos os sistemas estão a correr!"
echo " Pressione Ctrl+C para encerrar."
echo "=========================================="

# O comando wait é obrigatório para segurar o terminal aberto 
# já que os processos acima estão a correr em background (&)
wait