from geometry_msgs.msg import Twist
from sparki_interfaces.msg import MoveCmd
import rclpy
from rclpy.node import Node
import time

class MotionController(Node):

    def __init__(self):
        super().__init__('motion_controller')

        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)

        self.sub = self.create_subscription(
            MoveCmd,
            '/motion_cmd',
            self.callback,
            10
        )

        self.get_logger().info('Motion Controller iniciado')

    def callback(self, msg):
        twist = Twist()
        twist.linear.x = msg.linear
        twist.angular.z = msg.angular

        start = time.time()

        while time.time() - start < msg.duration:
            self.cmd_vel_pub.publish(twist)
            time.sleep(0.1)

        self.cmd_vel_pub.publish(Twist())  # stop


def main():
    rclpy.init()
    rclpy.spin(MotionController())
    rclpy.shutdown()
