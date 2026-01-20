import rclpy
from rclpy.node import Node
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan
from sparki_interfaces.srv import MoveRobot
import math
import time

class MovementController(Node):
    def __init__(self):
        super().__init__('movement_controller')

        self.callback_group = ReentrantCallbackGroup()
        
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        self.odom_sub = self.create_subscription(
            Odometry, 
            '/odom', 
            self.odom_callback, 
            10,
            callback_group=self.callback_group
        )
        
        self.scan_sub = self.create_subscription(
            LaserScan, 
            '/scan', 
            self.scan_callback, 
            10,
            callback_group=self.callback_group
        )
        
        self.srv = self.create_service(
            MoveRobot, 
            'move_robot', 
            self.handle_move_request,
            callback_group=self.callback_group
        )

        self.x_atual = 0.0
        self.y_atual = 0.0
        self.obstaculo_frente = False 
        
        self.get_logger().info("Sparki Controller (Multithread) Iniciado!")

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

    def handle_move_request(self, request, response):
        distancia_alvo = request.distancia_metros
        start_x = self.x_atual
        start_y = self.y_atual
        
        self.get_logger().info(f"MOVENDO: {distancia_alvo}m | Pos Inicial: ({start_x:.2f}, {start_y:.2f})")
        
        msg = Twist()
        if distancia_alvo > 0:
            msg.linear.x = 0.2
        else:
            msg.linear.x = -0.2
            
        distancia_alvo = abs(distancia_alvo)
        
        rate = self.create_rate(10)

        while rclpy.ok():

            if msg.linear.x > 0 and self.obstaculo_frente:
                self.parar()
                response.sucesso = False
                response.mensagem = "Parada de Emergência: Obstáculo detectado!"
                self.get_logger().error(response.mensagem)
                return response

            distancia_percorrida = math.sqrt(
                (self.x_atual - start_x)**2 + (self.y_atual - start_y)**2
            )
            
            if distancia_percorrida >= distancia_alvo:
                self.parar()
                response.sucesso = True
                response.mensagem = f"Destino atingido. Andei {distancia_percorrida:.2f}m."
                self.get_logger().info(response.mensagem)
                return response
            
            self.cmd_vel_pub.publish(msg)
            rate.sleep()

    def parar(self):
        self.cmd_vel_pub.publish(Twist())

def main(args=None):
    rclpy.init(args=args)
    node = MovementController()
    
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    
    try:
        executor.spin()
    finally:
        node.destroy_node()
        rclpy.shutdown()