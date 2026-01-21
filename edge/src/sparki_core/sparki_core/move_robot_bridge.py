import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32
from sparki_interfaces.srv import MoveRobot

class MoveRobotBridge(Node):

    def __init__(self):
        super().__init__('move_robot_bridge')

        self.cli = self.create_client(MoveRobot, '/move_robot')
        self.sub = self.create_subscription(
            Float32,
            '/move_robot_cmd',
            self.callback,
            10
        )

        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Aguardando service /move_robot...')

        self.get_logger().info('MoveRobot Bridge iniciado')

    def callback(self, msg):
        req = MoveRobot.Request()
        req.distancia_metros = msg.data

        self.get_logger().info(f'Requisição recebida: {msg.data}m')

        future = self.cli.call_async(req)

        future.add_done_callback(self.result_callback)

    def result_callback(self, future):
        try:
            res = future.result()
            self.get_logger().info(
                f'Service respondeu: sucesso={res.sucesso} | {res.mensagem}'
            )
        except Exception as e:
            self.get_logger().error(str(e))


def main(args=None):
    rclpy.init(args=args)
    node = MoveRobotBridge()
    rclpy.spin(node)
    rclpy.shutdown()
