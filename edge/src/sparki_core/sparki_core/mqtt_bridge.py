import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Range
from std_msgs.msg import Bool
import paho.mqtt.client as mqtt

class MqttBridge(Node):
    def __init__(self):
        super().__init__('mqtt_bridge')
        
        # Configuração do Cliente MQTT
        self.mqtt_client = mqtt.Client()
        # Conecta no broker local que instalamos no Docker
        self.mqtt_client.connect("localhost", 1883, 60)
        self.mqtt_client.loop_start()

        # Inscreve nos tópicos do ROS 2
        self.sonar_sub = self.create_subscription(Range, '/sonar', self.sonar_callback, 10)
        self.emergency_sub = self.create_subscription(Bool, '/emergency_stop', self.emergency_callback, 10)
        
        self.get_logger().info("MQTT Bridge Iniciada! Conectado ao Broker.")

    def sonar_callback(self, msg):
        # Publica a distância do sonar no tópico MQTT
        distancia_str = f"{msg.range:.2f}"
        self.mqtt_client.publish("sparki/telemetry/sonar", distancia_str)

    def emergency_callback(self, msg):
        # Publica o estado atual no tópico MQTT
        estado = "EMERGENCIA_OBSTACULO" if msg.data else "LIVRE"
        self.mqtt_client.publish("sparki/telemetry/status", estado)

def main(args=None):
    rclpy.init(args=args)
    node = MqttBridge()
    rclpy.spin(node)
    node.destroy_node()
    self.mqtt_client.loop_stop()
    rclpy.shutdown()