FROM osrf/ros:humble-desktop-full

RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-colcon-common-extensions \
    nano \
    git \
    x11-apps \
    xvfb \
    x11vnc \
    fluxbox \
    novnc \
    websockify \
    mesa-utils \
    mosquitto \
    mosquitto-clients \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    ros-humble-navigation2 \
    ros-humble-rosbridge-server \
    ros-humble-nav2-bringup \
    ros-humble-slam-toolbox \
    ros-humble-turtlebot3-gazebo \
    ros-humble-turtlebot3-teleop \
    ros-humble-robot-localization

RUN pip3 install paho-mqtt==1.6.1

ENV TURTLEBOT3_MODEL=waffle_pi
ENV GAZEBO_MODEL_PATH=/opt/ros/humble/share/turtlebot3_gazebo/models

WORKDIR /root/ros2_ws

RUN echo "source /opt/ros/humble/setup.bash" >> /root/.bashrc
CMD ["bash"]