import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import authRoutes from './routes/auth.ts'

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});