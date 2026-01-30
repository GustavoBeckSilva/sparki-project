// eslint-disable-next-line @typescript-eslint/no-var-requires
const ROSLIB = require('roslib');

const ROSBRIDGE_URL = 'ws://localhost:9090';

export const ros = new ROSLIB.Ros({
    url: ROSBRIDGE_URL
});

ros.on('connection', () => {
    console.log('Conectado ao ROS2 via rosbridge');
});

ros.on('error', (error: any) => {
    console.error('Erro ao conectar no ROS:', error);
});

ros.on('close', () => {
    console.log('Conexão com ROS encerrada');
});

export const cmdVel = new ROSLIB.Topic({
    ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/Twist'
});

export const moveRobotTopic = new ROSLIB.Topic({
    ros,
    name: '/move_robot_cmd',
    messageType: 'std_msgs/Float32'
});

export const sequenceExecutorStatusTopic = new ROSLIB.Service({
    ros,
    name: '/move_sequence',
    ServiceType: 'sparki_interfaces/srv/MoveSequence/'
});

