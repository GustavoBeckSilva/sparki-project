import express, { Request, Response } from 'express';
import { moveRobotTopic, sequenceExecutorStatusTopic } from './ros';
import { MoveCmd } from './model/MoveCmd';

export const app = express();

app.use(express.json());

app.post('/move', (req, res) => {
    const { distancia } = req.body;

    if (typeof distancia !== 'number') {
        return res.status(400).json({ error: 'Distância inválida' });
    }

    moveRobotTopic.publish({ data: distancia });

    res.json({
        status: 'enviado',
        distancia
    });
});

app.post('/move_sequence', async (req: Request, res: Response) => {
    const sequence = req.body.commands as MoveCmd[];

    console.log('Recebida sequência:', sequence);

    if (!Array.isArray(sequence)) {
        return res.status(400).json({ error: 'Sequência inválida!' });
    }

    try {
        const response = await new Promise((resolve, reject) => {
            sequenceExecutorStatusTopic.callService(
                {
                    commands: sequence
                },
                (result: any) => resolve(result),
                (err: any) => reject(err)
            );
        });

        res.status(200).json({
            status: 'Comando executado',
            resposta: response
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao executar a sequência' });
    }
});
