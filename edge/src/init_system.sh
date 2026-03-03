#!/bin/bash

# 1. Carrega o ROS base
source /opt/ros/humble/setup.bash

# Armadilha: Quando você apertar Ctrl+C, fecha tudo graciosamente
trap "echo 'Encerrando todos os sistemas...'; kill 0" EXIT

echo "=========================================="
echo " 0. Compilando o Workspace (Garante que tudo existe)..."
echo "=========================================="
cd /root/ros2_ws
colcon build --symlink-install

# 2. Carrega o seu projeto recém-compilado
source /root/ros2_ws/install/setup.bash

echo "=========================================="
echo " 1. Iniciando Simulação Gazebo..."
echo "=========================================="
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &

# Espera 8 segundos para o Gazebo abrir e a física carregar
sleep 8 

echo "=========================================="
echo " 2. Iniciando Ponte de Comunicação (WebSocket)..."
echo "=========================================="
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &

# Espera a ponte ligar
sleep 3

echo "=========================================="
echo " 3. Iniciando Controlador Cérebro (Sparki)..."
echo "=========================================="
# O controlador fica rodando "preso" no terminal para você ver os logs
ros2 run sparki_core controller
