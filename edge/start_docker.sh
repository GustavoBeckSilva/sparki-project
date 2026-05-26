#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="ros2-edge-dev"
CONTAINER_NAME="edge"
HOST_OS="$(uname -s)"

docker build -t "${IMAGE_NAME}" "${SCRIPT_DIR}"

docker_args=(
    run
    -it
    --name "${CONTAINER_NAME}"
    --rm
    --privileged
    --env="QT_X11_NO_MITSHM=1"
    --volume="${SCRIPT_DIR}/src:/root/ros2_ws/src"
)

if [ "${HOST_OS}" = "Darwin" ]; then
    GUI_MODE="${GUI_MODE:-vnc}"
    docker_args+=(
        --publish="9090:9090"
        --publish="5900:5900"
        --publish="6080:6080"
        --env="GUI_MODE=${GUI_MODE}"
    )

    if [ "${GUI_MODE}" = "vnc" ]; then
        docker_args+=(
            --env="DISPLAY=:99"
            --env="LIBGL_ALWAYS_SOFTWARE=1"
            --env="MESA_GL_VERSION_OVERRIDE=3.3"
            --env="MESA_GLSL_VERSION_OVERRIDE=330"
        )
        echo "macOS detectado: usando VNC/noVNC para apps graficos."
        echo "Depois de rodar ./init_system.sh, abra http://localhost:6080/vnc.html"
    else
    # XQuartz precisa estar aberto e com "Allow connections from network clients" habilitado.
        DISPLAY_VALUE="${DISPLAY:-host.docker.internal:0}"

        if [[ "${DISPLAY_VALUE}" == /private/tmp/* ]] ||
           [[ "${DISPLAY_VALUE}" == /tmp/* ]] ||
           [[ "${DISPLAY_VALUE}" == :* ]] ||
           [[ "${DISPLAY_VALUE}" == localhost:* ]] ||
           [[ "${DISPLAY_VALUE}" == 127.0.0.1:* ]]; then
            DISPLAY_VALUE="host.docker.internal:0"
        fi

        if command -v xhost >/dev/null 2>&1; then
            xhost +localhost >/dev/null 2>&1 || true
            xhost +127.0.0.1 >/dev/null 2>&1 || true
        fi

        docker_args+=(
            --env="DISPLAY=${DISPLAY_VALUE}"
            --env="LIBGL_ALWAYS_INDIRECT=1"
        )
    fi
else
    if command -v xhost >/dev/null 2>&1; then
        xhost +local:root >/dev/null 2>&1 || true
    fi

    docker_args+=(
        --net=host
        --env="DISPLAY=${DISPLAY:-:0}"
        --env="WAYLAND_DISPLAY=${WAYLAND_DISPLAY:-}"
        --env="XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/1000}"
        --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw"
    )

    if [ -d /run/user/1000 ]; then
        docker_args+=(--volume="/run/user/1000:/run/user/1000:rw")
    fi

    if [ -e /dev/dri ]; then
        docker_args+=(--device /dev/dri)
    fi
fi

docker "${docker_args[@]}" "${IMAGE_NAME}"
