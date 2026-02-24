import { moveRobotService } from './ros';
import { app } from './server';

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});

