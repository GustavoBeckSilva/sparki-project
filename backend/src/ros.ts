
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

export const moveRobotService = new ROSLIB.Service({
    ros,
    name: '/move_robot',
    serviceType: 'sparki_interfaces/srv/MoveRobot'
});

export const moveSequenceService = new ROSLIB.Service({
    ros,
    name: '/move_sequence',
    serviceType: 'sparki_interfaces/srv/MoveSequence'
});