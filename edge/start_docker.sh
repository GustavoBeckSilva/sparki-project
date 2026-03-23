xhost +local:root

docker build -t ros2-edge-dev .

docker run -it \
    --name edge \
    --rm \
    --net=host \
    --privileged \
    --device /dev/dri \
    --env="DISPLAY" \
    --env="QT_X11_NO_MITSHM=1" \
    --env="WAYLAND_DISPLAY=${WAYLAND_DISPLAY}" \
    --env="XDG_RUNTIME_DIR=/run/user/1000" \
    --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" \
    --volume="/run/user/1000:/run/user/1000:rw" \
    --volume="$(pwd)/src:/root/ros2_ws/src" \
    ros2-edge-dev