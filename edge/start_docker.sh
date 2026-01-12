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
    --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" \
    --volume="$(pwd)/src/root/ros2-ws/src" \
    ros2-edge-dev