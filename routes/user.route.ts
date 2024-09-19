import express from 'express';
import { activateUser, loginUser, registerationUser} from '../controllers/user.controller';
// import { authorizeRoles, isAutheticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerationUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)

// userRouter.get('/refreshtoken', updateAccessToken)
// userRouter.get('/logout', logoutUser)

export default userRouter;