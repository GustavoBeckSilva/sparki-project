import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Range
from std_msgs.msg import Bool

class CollisionDetector(Node):
    def __init__(self):
        super().__init__('collision_detector')
        
        self.scan_sub = self.create_subscription(LaserScan, '/scan', self.scan_callback, 10)
        self.sonar_sub = self.create_subscription(Range, '/sonar', self.sonar_callback, 10)
        self.emergency_pub = self.create_publisher(Bool, '/emergency_stop', 10)
        
        self.obstaculo_scan = False
        self.obstaculo_sonar = False

    def scan_callback(self, msg):
        distancia = msg.ranges[0]
        if distancia == float('inf') or distancia == 0.0:
            distancia = 3.5
        self.obstaculo_scan = distancia < 0.40
        self.publish_emergency_state()

    def sonar_callback(self, msg):
        self.obstaculo_sonar = msg.range < 0.40
        self.publish_emergency_state()

    def publish_emergency_state(self):
        tem_obstaculo = self.obstaculo_scan or self.obstaculo_sonar
        msg = Bool()
        msg.data = tem_obstaculo
        self.emergency_pub.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = CollisionDetector()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()