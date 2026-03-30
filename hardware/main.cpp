#include <Arduino.h>
#include <micro_ros_platformio.h>
#include <stdio.h>
#include <rcl/rcl.h>
#include <rcl/error_handling.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <geometry_msgs/msg/twist.h>

#define LED_PIN 2

rcl_subscription_t subscriber;
geometry_msgs__msg__Twist msg;
rclc_executor_t executor;
rclc_support_t support;
rcl_allocator_t allocator;
rcl_node_t node;


void cmd_vel_callback(const void * msgin) {
  const geometry_msgs__msg__Twist * twist_msg = (const geometry_msgs__msg__Twist *)msgin;
  
  if (twist_msg->linear.x != 0.0 || twist_msg->angular.z != 0.0) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  // ==========================================
  // CONFIGURAÇÕES DE REDE
  // ==========================================
  IPAddress agent_ip(192, 168, 0, 100); // Alterar IP
  size_t agent_port = 8888;
  char ssid[] = "NomeRede";       // Alterar nome da rede
  char psk[] = "SenhaRede";       // Alterar senha da rede

  set_microros_wifi_transports(ssid, psk, agent_ip, agent_port);
  delay(2000);

  allocator = rcl_get_default_allocator();
  rclc_support_init(&support, 0, NULL, &allocator);

  rclc_node_init_default(&node, "esp32_hardware_node", "", &support);

  rclc_subscription_init_default(
    &subscriber,
    &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(geometry_msgs, msg, Twist),
    "/cmd_vel"
  );

  rclc_executor_init(&executor, &support.context, 1, &allocator);
  rclc_executor_add_subscription(&executor, &subscriber, &msg, &cmd_vel_callback, ON_NEW_DATA);

}

void loop() {
  rclc_executor_spin_some(&executor, RCL_MS_TO_NS(100));
}