import express from 'express';
import { loginUser, registerationUser} from '../controllers/user.controller';
// import { authorizeRoles, isAutheticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerationUser)
userRouter.post('/login', loginUser)

export default userRouter;