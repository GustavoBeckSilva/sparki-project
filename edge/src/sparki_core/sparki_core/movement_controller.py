import rclpy

from rclpy.node import Node
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan

from sparki_interfaces.srv import MoveRobot, MoveSequence
from sparki_interfaces.msg import MoveCmd

import math
import time

class UnifiedController(Node):
    def __init__(self):
        super().__init__('movement_controller')

        self.callback_group = ReentrantCallbackGroup()
        
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        self.odom_sub = self.create_subscription(
            Odometry, '/odom', self.odom_callback, 10,
            callback_group=self.callback_group)
        
        self.scan_sub = self.create_subscription(
            LaserScan, '/scan', self.scan_callback, 10,
            callback_group=self.callback_group)
        
        # pode ser removida
        self.motion_sub = self.create_subscription(
            MoveCmd, '/motion_cmd', self.motion_callback, 10,
            callback_group=self.callback_group)
        
        # move por distância, evita colisões. usada na rota /move'
        self.srv_move = self.create_service(
            MoveRobot, 'move_robot', self.handle_move_request,
            callback_group=self.callback_group)

        # move por sequência de distâncias e direções, evita colisões. usada na rota /move_sequence
        self.srv_sequence = self.create_service(
            MoveSequence, '/move_sequence', self.handle_sequence_request,
            callback_group=self.callback_group)

        self.x_atual = 0.0
        self.y_atual = 0.0
        self.obstaculo_frente = False 
        
        self.get_logger().info("Sparki Controller Iniciado!")

    def odom_callback(self, msg):
        self.x_atual = msg.pose.pose.position.x
        self.y_atual = msg.pose.pose.position.y

    def scan_callback(self, msg):
        distancia_lida = msg.ranges[0]
        if distancia_lida == float('inf') or distancia_lida == 0.0:
            distancia_lida = 3.5 

        if distancia_lida < 0.40: 
            if not self.obstaculo_frente:
                self.get_logger().warn(f"OBSTÁCULO! Distância: {distancia_lida:.2f}m")
            self.obstaculo_frente = True
        else:
            self.obstaculo_frente = False

    def motion_callback(self, msg):
        self.get_logger().info(f"Comando de Tópico Recebido: Linear {msg.linear}, Angular {msg.angular}, Duração {msg.duration}s")
        twist = Twist()
        twist.linear.x = msg.linear
        twist.angular.z = msg.angular

        start = time.time()
        while time.time() - start < msg.duration:
            if twist.linear.x > 0 and self.obstaculo_frente:
                self.get_logger().error("Parada de Emergência no Tópico: Obstáculo detectado!")
                self.parar()
                return
            
            self.cmd_vel_pub.publish(twist)
            time.sleep(0.1)

        self.parar()

    def handle_move_request(self, request, response):
        distancia_alvo = request.distancia_metros
        start_x = self.x_atual
        start_y = self.y_atual
        
        self.get_logger().info(f"MOVENDO POR DISTÂNCIA: {distancia_alvo}m")
        
        msg = Twist()
        msg.linear.x = 0.2 if distancia_alvo > 0 else -0.2
        distancia_alvo = abs(distancia_alvo)
        
        while rclpy.ok():
            if msg.linear.x > 0 and self.obstaculo_frente:
                self.parar()
                response.sucesso = False
                response.mensagem = "Parada de Emergência: Obstáculo detectado!"
                self.get_logger().error(response.mensagem)
                return response

            distancia_percorrida = math.sqrt((self.x_atual - start_x)**2 + (self.y_atual - start_y)**2)
            
            if distancia_percorrida >= distancia_alvo:
                self.parar()
                response.sucesso = True
                response.mensagem = f"Destino atingido. Andei {distancia_percorrida:.2f}m."
                self.get_logger().info(response.mensagem)
                return response
            
            self.cmd_vel_pub.publish(msg)
            time.sleep(0.1)



    def handle_sequence_request(self, req, res):
        self.get_logger().info(f"Iniciando Sequência de {len(req.commands)} comandos...")
        for index, cmd in enumerate(req.commands):
            
            if cmd.linear > 0 and self.obstaculo_frente:
                self.parar()
                res.sucesso = False
                res.mensagem = f"Abortado no passo {index}: Obstáculo detectado antes de mover."
                return res

            twist = Twist()
            twist.linear.x = cmd.linear
            twist.angular.z = cmd.angular

            start = time.time()
            while time.time() - start < cmd.duration:
                if twist.linear.x > 0 and self.obstaculo_frente:
                    self.parar() 
                    res.sucesso = False
                    res.mensagem = f"Emergência no passo {index}: Obstáculo entrou na frente!"
                    return res

                self.cmd_vel_pub.publish(twist)
                time.sleep(0.1)

        self.parar()
        time.sleep(0.2)
        res.sucesso = True
        res.mensagem = "Sequência executada com sucesso!"
        return res

    def parar(self):
        self.cmd_vel_pub.publish(Twist())

def main(args=None):
    rclpy.init(args=args)
    node = UnifiedController()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    finally:
        node.destroy_node()
        rclpy.shutdown()