import express, { Request, Response } from 'express';
import cors from 'cors';
import { moveRobotService, moveSequenceService, navigateToWaypoint } from './ros';

export const app = express();

app.use(cors());

app.use(express.json());

app.post('/move', async (req: Request, res: Response) => {
    const { distancia } = req.body;

    if (typeof distancia !== 'number') {
        return res.status(400).json({ error: 'Distância inválida. Envie um número.' });
    }

    console.log(`[Backend] Solicitando ao robô para mover ${distancia} metros...`);

    const request = {
        distancia_metros: distancia
    };

    try {
        const response: any = await new Promise((resolve, reject) => {
            moveRobotService.callService(
                request,
                (result: any) => resolve(result),
                (err: any) => reject(err)
            );
        });

        if (response.sucesso) {
            res.status(200).json({
                status: 'sucesso',
                mensagem: response.mensagem
            });
        } else {
            res.status(400).json({
                status: 'bloqueado',
                mensagem: response.mensagem
            });
        }

    } catch (error) {
        console.error('Erro de comunicação com o Edge:', error);
        res.status(500).json({ error: 'Erro de conexão com o robô' });
    }
});

app.post('/move_sequence', async (req: Request, res: Response) => {
    const sequence = req.body.commands;

    if (!Array.isArray(sequence)) {
        return res.status(400).json({ error: 'O payload deve conter um array "commands".' });
    }

    console.log(`[Backend] Enviando sequência de ${sequence.length} comandos para o Edge...`);

    try {
        const response: any = await new Promise((resolve, reject) => {
            moveSequenceService.callService(
                { commands: sequence },
                (result: any) => resolve(result),
                (err: any) => reject(err)
            );
        });

        if (response.sucesso) {
            res.status(200).json({
                status: 'sucesso',
                mensagem: response.mensagem
            });
        } else {
            res.status(400).json({
                status: 'bloqueado',
                mensagem: response.mensagem
            });
        }

    } catch (error) {
        console.error('Erro de comunicação com o Edge:', error);
        res.status(500).json({ error: 'Erro de conexão com o robô' });
    }
});

app.post('/navigate', async (req, res) => {
    const { waypoint } = req.body;

    const WAYPOINTS: Record<string, { x: number, y: number }> = {
        "origem": { x: 0.0, y: 0.0 },
        "sala_1": { x: 3.0, y: 0.0 },
        "corredor": { x: 6.0, y: 0.0 },
        "sala_2": { x: 9.0, y: 0.0 },
        "sala_3": { x: 9.0, y: 4.0 },
    };

    const alvo = WAYPOINTS[waypoint];
    if (!alvo) {
        return res.status(400).json({ erro: `Waypoint desconhecido: ${waypoint}` });
    }

    try {
        const response: any = await new Promise((resolve, reject) => {
            navigateToWaypoint.callService(
                { x: alvo.x, y: alvo.y },
                (result: any) => resolve(result),
                (err: any) => reject(err)
            );
        });

        if (response.sucesso) {
            res.status(200).json({
                status: 'sucesso',
                mensagem: response.mensagem
            });
        } else {
            res.status(400).json({
                status: 'bloqueado',
                mensagem: response.mensagem
            });
        }
    } catch (error) {
        console.error('Erro de comunicação com o Edge:', error);
        res.status(500).json({ error: 'Erro de conexão com o robô' });
    }
});