import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registerationUser, updateAccessToken} from '../controllers/user.controller';
import { isAutheticated, updateToken } from '../middleware/auth';
// import { authorizeRoles, isAutheticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerationUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)

userRouter.get('/refreshtoken',updateToken, updateAccessToken)
userRouter.get('/logout', isAutheticated, logoutUser)
userRouter.get('/me', isAutheticated ,getUserInfo)

export default userRouter;