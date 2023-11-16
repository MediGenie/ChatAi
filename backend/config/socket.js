let io;

module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer, {
      // options if any
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};