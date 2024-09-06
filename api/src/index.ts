import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import Database from 'better-sqlite3';
import { getSessionData, isInstalled, sendTransaction } from './logic/module';
import { ZeroAddress } from 'ethers';
import { getJsonRpcProvider } from './logic/web3';
import { buildTransferToken } from './logic/utils';
import { Hex, PrivateKeyAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const app = express();
const port = 8080;

dotenv.config();
app.use(express.json());
app.use(cors()); // Use cors middleware

const walletProvider: PrivateKeyAccount = privateKeyToAccount(process.env.PRIVATE_KEY! as Hex);
const chainId = '137'

interface ScheduleRequest {
  sessionId: string;
}

interface Job {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  interval: number;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  intervalId?: NodeJS.Timeout;
  timeoutId?: NodeJS.Timeout;
}

const jobs = new Map<string, Job>();

let db: Database.Database;

function initDb() {
  db = new Database('./jobs.sqlite');

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      startTime TEXT,
      endTime TEXT,
      interval INTEGER,
      status TEXT
    )
  `);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveJob(job: Job) {
  const stmt = db.prepare('INSERT OR REPLACE INTO jobs (id, sessionId, startTime, endTime, interval, status) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(job.id, job.sessionId, job.startTime.toISOString(), job.endTime.toISOString(), job.interval, job.status);
}

function loadJobs() {
  const stmt = db.prepare('SELECT * FROM jobs WHERE status IN (\'scheduled\', \'running\')');
  const rows = stmt.all() as Array<{
      sessionId: string;id: string, startTime: string, endTime: string, interval: number, status: 'scheduled' | 'running'
}>;
  for (const row of rows) {
    const job: Job = {
      id: row.id,
      sessionId: row.sessionId,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      interval: row.interval,
      status: row.status
    };
    scheduleJob(job);
  }
}


async function executeJob(sessionId: string) {
    const maxRetries = 10;
    const waitTime = 5000;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            attempt++;
            const sessionData = await getSessionData(chainId, walletProvider.address, sessionId);
            const provider = await getJsonRpcProvider(chainId);
            const data = await buildTransferToken(sessionData.token, walletProvider.address, sessionData.limitAmount, provider);
            await sendTransaction(chainId, sessionId, sessionData.token, 0n, data as Hex, walletProvider, sessionData.account);
            // Exit the loop if the transaction is successful
            break;
        } catch (e) {
            console.log(`Attempt ${attempt} failed. Retrying...`);
            if (attempt >= maxRetries) {
                console.log('Max retries reached. Failing job.');
            }
            await delay(waitTime);
        }
    }
}

function scheduleJob(job: Job) {
  const now = new Date();
  const delay = Math.max(0, job.startTime.getTime() - now.getTime());

  
  job.timeoutId = setTimeout(async () => {
    job.status = 'running';
    saveJob(job);

    const duration = job.endTime.getTime() - Math.max(job.startTime.getTime(), now.getTime());

    // Logic to start the job and run on every interval
    if(duration > 0) {

    // Start the job once at the beginning, Add your custom logic here    
    console.log(`Job ${job.id} triggered at ${new Date().toISOString()}`);
    await executeJob(job.sessionId)

    job.intervalId = setInterval(async () => {

      console.log(`Job ${job.id} triggered at ${new Date().toISOString()}`);
      await executeJob(job.sessionId)
      // Start the job after the intervals, Add your custom logic here
    }, job.interval * 1000);

    // Logic to end the job
    job.timeoutId = setTimeout(() => {
      clearInterval(job.intervalId);
      job.status = 'completed';
      saveJob(job);
      jobs.delete(job.id);
      console.log(`Job ${job.id} completed at ${new Date().toISOString()}`);
    }, duration);       
    }
    else {
        job.status = 'completed';
        saveJob(job);
        jobs.delete(job.id);
        console.log(`Job ${job.id} completed at ${new Date().toISOString()}`);

    }

  }, delay);

  jobs.set(job.id, job);
  saveJob(job);
}

app.post('/schedule', async (req, res) => {
  const { sessionId }: ScheduleRequest = req.body;

  const sessionData = await getSessionData(chainId, walletProvider.address, sessionId)

  const start = new Date(Number(sessionData.validAfter)*1000);
  const end = new Date(Number(sessionData.validUntil)*1000);
  const interval = Number(sessionData.refreshInterval)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }

  if (interval <= 0) {
    return res.status(400).json({ error: 'Interval must be positive' });
  }

  const job: Job = {
    id: `job_${Date.now()}`,
    sessionId: sessionId,
    startTime: start,
    endTime: end,
    interval,
    status: 'scheduled'
  };

  scheduleJob(job);

  res.json({ message: 'Job scheduled successfully', jobId: job.id });
});

app.delete('/cancel/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (job) {
    if (job.intervalId) clearInterval(job.intervalId);
    if (job.timeoutId) clearTimeout(job.timeoutId);
    job.status = 'cancelled';
    saveJob(job);
    jobs.delete(jobId);
    res.json({ message: 'Job canceled successfully' });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.get('/jobs', async (req, res) => {
  const stmt = db.prepare('SELECT * FROM jobs');
  const allJobs = stmt.all();
  res.json(allJobs);
});

function startServer() {
  initDb();
  loadJobs();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();