import express from 'express';
import { activateUser, loginUser, logoutUser, registerationUser, updateAccessToken} from '../controllers/user.controller';
import { isAutheticated } from '../middleware/auth';
// import { authorizeRoles, isAutheticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerationUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)

userRouter.get('/refreshtoken', isAutheticated, updateAccessToken)
userRouter.get('/logout', isAutheticated, logoutUser)

export default userRouter;