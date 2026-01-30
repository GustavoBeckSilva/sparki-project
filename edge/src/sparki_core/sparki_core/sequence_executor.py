from sparki_interfaces.srv import MoveSequence
from sparki_interfaces.msg import MoveCmd
from geometry_msgs.msg import Twist
import rclpy
import time
from rclpy.node import Node

class SequenceExecutor(Node):

    def __init__(self):
        super().__init__('sequence_executor')

        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)

        self.srv = self.create_service(
            MoveSequence,
            '/move_sequence',
            self.handle_request   
        )

        self.get_logger().info('Sequence Executor iniciado')

    def handle_request(self, req, res):
        for cmd in req.commands:
            twist = Twist()
            twist.linear.x = cmd.linear
            twist.angular.z = cmd.angular

            start = time.time()
            while time.time() - start < cmd.duration:
                self.cmd_vel_pub.publish(twist)
                time.sleep(0.1)

        # Para o robô no final
        self.cmd_vel_pub.publish(Twist())
        time.sleep(0.2)

        res.sucesso = True
        res.mensagem = "Sequência executada"
        return res


def main():
    rclpy.init()
    node = SequenceExecutor()
    rclpy.spin(node)
    rclpy.shutdown()
