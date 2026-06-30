export interface Command {
    linear: number;
    angular: number;
    duration: number;
}

export interface SequenceReturn {
    isSuccess: boolean;
    message: string;
}

export async function SendMoveSequence(commands: Command[]): Promise<SequenceReturn> {
    const url = 'http://localhost:3000/move_sequence';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ commands }),
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        
        return {
            // Verifica se a API devolveu sucesso
            isSuccess: apiData.status === 'sucesso' || apiData.sucesso === true,
            message: apiData.mensagem || 'Comando finalizado.'
        };

    } catch (err: any) {
        return { isSuccess: false, message: "Erro de conexão: " + err.message };
    }
}