interface Command{
    direction: string;
    angulation: string;
    duration: string;
}

interface SequenceReturn{
    isSucess: boolean;
    data: string
}

export async function SendMoveSequence(commands:Command[]) : Promise<SequenceReturn> {
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
            var data: SequenceReturn = await response.json();
            return data;
    }
    catch(err){
        var errormessage: SequenceReturn = {isSucess: false, data: "API ERROR:"+err};
        return errormessage;
    }
}
