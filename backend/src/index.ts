import express, { Request, Response } from 'express';
import cors from 'cors';
import { DeploymentController } from './controllers/deployment.controller';
import multer from 'multer';

const app = express();
const port = Number(process.env.PORT ?? 6492);

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const deploymentController = new DeploymentController();

app.get('/api/deployments', (req: Request, res: Response) => {
    deploymentController.getAll(req, res);
});

app.post('/api/deployments/git', (req: Request, res: Response) => {
    deploymentController.createGit(req, res);
});

app.post(
    '/api/deployments/upload',
    upload.single('project'),
    (req: Request, res: Response) => {
        deploymentController.createUpload(req, res);
    }
);

app.get('/api/deployments/:id/logs/stream', (req, res) => {
    return deploymentController.streamLogs(req, res);
});

app.get('/api/deployments/:id/logs', (req, res) => {
    console.log('here');
    return deploymentController.getAllLogs(req, res);
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
