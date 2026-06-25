interface Command{
    direction: string;
    angulation: string;
    duration: string;
}

export async function SendMoveSequence(commands:Command[]) : Promise<boolean> {
    const url = 'http://localhost:3000/move_sequence';

    try
    {
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
        else
            return true;
    }
    catch{
        return false;
    }
}
