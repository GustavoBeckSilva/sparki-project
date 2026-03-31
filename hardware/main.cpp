#include <Arduino.h>
#include <micro_ros_platformio.h>
#include <rcl/rcl.h>
#include <rcl/error_handling.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <geometry_msgs/msg/twist.h>

#include <RoboCore_Vespa.h> 

#define LED_PIN 2

// Velocidade máxima mapeada para o range da Vespa (0-100)
#define VEL_MAX 100
#define VEL_LINEAR_MAX 0.5   // m/s máximo esperado do ROS
#define VEL_ANGULAR_MAX 1.0  // rad/s máximo esperado do ROS

rcl_subscription_t subscriber;
geometry_msgs__msg__Twist msg;
rclc_executor_t executor;
rclc_support_t support;
rcl_allocator_t allocator;
rcl_node_t node;

VespaMotors motors;  // <- objeto dos motores

// Converte velocidade ROS (-1.0 a 1.0) para Vespa (-100 a 100)
int toVespaSpeed(float ros_speed, float max_speed) {
  int speed = (int)((ros_speed / max_speed) * VEL_MAX);
  return constrain(speed, -VEL_MAX, VEL_MAX);
}

void cmd_vel_callback(const void * msgin) {
  const geometry_msgs__msg__Twist * twist = (const geometry_msgs__msg__Twist *)msgin;

  float linear  = twist->linear.x;
  float angular = twist->angular.z;

  // Parar
  if (linear == 0.0 && angular == 0.0) {
    motors.stop();
    digitalWrite(LED_PIN, LOW);
    return;
  }

  digitalWrite(LED_PIN, HIGH);

  // Só linear — andar para frente/trás
  if (angular == 0.0) {
    int speed = toVespaSpeed(linear, VEL_LINEAR_MAX);
    if (speed > 0) motors.forward(abs(speed));
    else           motors.backward(abs(speed));
    return;
  }

  // Só angular — rotacionar no lugar
  if (linear == 0.0) {
    int speed = toVespaSpeed(angular, VEL_ANGULAR_MAX);
    // angular > 0 = esquerda, angular < 0 = direita
    if (speed > 0) motors.turn(-abs(speed),  abs(speed));  // gira esquerda
    else           motors.turn( abs(speed), -abs(speed));  // gira direita
    return;
  }

  // Linear + angular — curva
  int vel_linear  = toVespaSpeed(linear,  VEL_LINEAR_MAX);
  int vel_angular = toVespaSpeed(angular, VEL_ANGULAR_MAX);

  int vel_esq = constrain(vel_linear - vel_angular, -VEL_MAX, VEL_MAX);
  int vel_dir = constrain(vel_linear + vel_angular, -VEL_MAX, VEL_MAX);
  motors.turn(vel_esq, vel_dir);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  IPAddress agent_ip(192, 168, 0, 100); // <- seu IP
  size_t agent_port = 8888;
  char ssid[] = "NomeRede";             // <- sua rede
  char psk[]  = "SenhaRede";            // <- sua senha

  set_microros_wifi_transports(ssid, psk, agent_ip, agent_port);
  delay(2000);

  allocator = rcl_get_default_allocator();
  rclc_support_init(&support, 0, NULL, &allocator);
  rclc_node_init_default(&node, "esp32_hardware_node", "", &support);

  rclc_subscription_init_default(
    &subscriber, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(geometry_msgs, msg, Twist),
    "/cmd_vel"
  );

  rclc_executor_init(&executor, &support.context, 1, &allocator);
  rclc_executor_add_subscription(&executor, &subscriber, &msg, &cmd_vel_callback, ON_NEW_DATA);
}

void loop() {
  rclc_executor_spin_some(&executor, RCL_MS_TO_NS(100));
}