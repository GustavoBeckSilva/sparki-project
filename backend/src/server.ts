import express, { Request, Response } from 'express';
import { moveRobotTopic } from './ros';

export const app = express();

app.use(express.json());

app.post('/move', (req, res) => {
    const { distancia } = req.body;

    if (typeof distancia !== 'number') {
        return res.status(400).json({ error: 'distancia inválida' });
    }

    moveRobotTopic.publish({ data: distancia });

    res.json({
        status: 'enviado',
        distancia
    });
});