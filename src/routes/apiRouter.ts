import { Router } from 'express';

import Paths from '@src/common/constants/Paths';

import AttendanceLogRoutes from './AttendanceLogRoutes';
import UserRoutes from './UserRoutes';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ----------------------- Add UserRouter --------------------------------- //

const userRouter = Router();

userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);

apiRouter.use(Paths.Users._, userRouter);

// ----------------------- Add AttendanceLogRouter ----------------------- //

const attendanceRouter = Router();

const attendanceSummaryRouter = Router();
attendanceSummaryRouter.get(Paths.Attendance.Summary.GetByUser, AttendanceLogRoutes.getSummary);
apiRouter.use(Paths.Attendance.Summary._, attendanceSummaryRouter);

const attendanceLogsRouter = Router();
attendanceLogsRouter.get(Paths.Attendance.Logs.GetByUser, AttendanceLogRoutes.getByUser);
attendanceLogsRouter.delete(Paths.Attendance.Logs.GetByUser, AttendanceLogRoutes.delete);
apiRouter.use(Paths.Attendance.Logs._, attendanceLogsRouter);

attendanceRouter.post(Paths.Attendance.Logs.CheckIn, AttendanceLogRoutes.checkIn);
attendanceRouter.post(Paths.Attendance.Logs.CheckOut, AttendanceLogRoutes.checkOut);

apiRouter.use(Paths.Attendance._, attendanceRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
