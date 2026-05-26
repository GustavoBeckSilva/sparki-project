#!/bin/bash

# 1. Carrega o ROS base
source /opt/ros/humble/setup.bash

# Armadilha: Quando você apertar Ctrl+C, fecha tudo graciosamente
trap "echo 'Encerrando todos os sistemas...'; kill 0" EXIT

if [ "${GUI_MODE:-}" = "vnc" ]; then
    echo "=========================================="
    echo " 0. Iniciando desktop virtual VNC..."
    echo "=========================================="

    for cmd in Xvfb x11vnc fluxbox websockify; do
        if ! command -v "${cmd}" >/dev/null 2>&1; then
            echo "Dependencia ausente: ${cmd}. Rebuild a imagem com ./start_docker.sh."
            exit 1
        fi
    done

    export DISPLAY="${DISPLAY:-:99}"
    export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-root}"
    export QT_X11_NO_MITSHM=1
    export LIBGL_ALWAYS_SOFTWARE=1
    export MESA_GL_VERSION_OVERRIDE="${MESA_GL_VERSION_OVERRIDE:-3.3}"
    export MESA_GLSL_VERSION_OVERRIDE="${MESA_GLSL_VERSION_OVERRIDE:-330}"

    mkdir -p "${XDG_RUNTIME_DIR}"
    chmod 700 "${XDG_RUNTIME_DIR}"

    Xvfb "${DISPLAY}" -screen 0 1600x1000x24 +extension GLX +render -noreset >/tmp/xvfb.log 2>&1 &
    sleep 2
    fluxbox >/tmp/fluxbox.log 2>&1 &
    x11vnc -display "${DISPLAY}" -forever -shared -rfbport 5900 -nopw >/tmp/x11vnc.log 2>&1 &
    websockify --web=/usr/share/novnc 6080 localhost:5900 >/tmp/novnc.log 2>&1 &

    echo "Desktop virtual pronto em http://localhost:6080/vnc.html"
fi

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

# Inicializa o mapa de occupancy grid
echo "=========================================="
echo " 2. Iniciando Mapa..."
echo "=========================================="
source /root/ros2_ws/install/setup.bash &
ros2 launch sparki_core amcl_localization.launch.py &

# Inicializa o websocket que possibilita a comunicação com a API
echo "=========================================="
echo " 3. Iniciando Ponte de Comunicação (WebSocket)..."
echo "=========================================="
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &

# Espera a ponte ligar
sleep 3

echo "=========================================="
echo " 4. Iniciando Controlador Main (Sparki)..."
echo "=========================================="
# O controlador fica rodando "preso" no terminal para você ver os logs
ros2 run sparki_core controller &

sleep 10
echo "=========================================="
echo " 5. Iniciando o rviz (usado para visualizar o mapa do if)..."
echo "=========================================="
# Inicializa ele com base nas configurações modificadas no arquivo /config/map.rviz.
# Em Docker sem X11/Wayland disponível, o RViz falha com erro do plugin Qt "xcb".
if [ "${RUN_RVIZ:-auto}" = "0" ] || [ "${RUN_RVIZ:-auto}" = "false" ]; then
    echo "RViz desabilitado por RUN_RVIZ=${RUN_RVIZ}."
    echo "Sistemas rodando. Pressione Ctrl+C para encerrar."
    wait
elif [ "${RUN_RVIZ:-auto}" != "1" ] && [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
    echo "Nenhum display grafico encontrado; pulando RViz."
    echo "Para abrir o RViz, rode o container com DISPLAY/X11 configurado ou use RUN_RVIZ=1."
    echo "Sistemas rodando. Pressione Ctrl+C para encerrar."
    wait
else
    colcon build --packages-select sparki_interfaces sparki_core
    source install/setup.bash
    ros2 run rviz2 rviz2 -d /root/ros2_ws/src/sparki_core/config/map.rviz
fi
