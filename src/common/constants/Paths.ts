import jetPaths from 'jet-paths';

const Paths = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    GetById: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Attendance: {
    _: '/attendance',
    Logs: {
      _: '/logs',
      GetByUser: '/user/:id_usuario',
      Add: '/add',
      CheckIn: '/check-in',
      CheckOut: '/check-out/:id_registro',
    },
    Summary: {
      _: '/summary',
      GetByUser: '/:id_usuario',
    },
  },
  Institutions: {
    _: '/institutions',
    Get: '/all',
    GetById: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Locations: {
    _: '/locations',
    Get: '/all',
    GetById: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Schedules: {
    _: '/schedules',
    Get: '/all',
    GetById: '/:id',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
