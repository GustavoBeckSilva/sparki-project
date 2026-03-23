import os
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    map_file = '/root/ros2_ws/src/maps/map.yaml'

    return LaunchDescription([

        # Publica o mapa como OccupancyGrid no tópico /map
        Node(
            package='nav2_map_server',
            executable='map_server',
            name='map_server',
            output='screen',
            parameters=[{
                'yaml_filename': map_file,
                'topic_name': 'map',
                'frame_id': 'map',
                'use_sim_time': True,
            }]
        ),

        # Obrigatório: ativa o lifecycle do map_server
        Node(
            package='nav2_lifecycle_manager',
            executable='lifecycle_manager',
            name='lifecycle_manager_map',
            output='screen',
            parameters=[{
                'autostart': True,
                'node_names': ['map_server'],
                'use_sim_time': True,
            }]
        ),

        # Ancora o frame do mapa na origem da odometria
        Node(
            package='tf2_ros',
            executable='static_transform_publisher',
            name='map_to_odom',
            arguments=['0', '0', '0', '0', '0', '0', 'map', 'odom']
        ),
    ])