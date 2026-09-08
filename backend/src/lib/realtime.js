let io = null;

function setIo(serverIo) {
  io = serverIo;
}

function getIo() {
  return io;
}

function emitToBusiness(businessId, event, payload) {
  if (!io || !businessId) return;
  io.to(`business:${businessId}`).emit(event, payload);
}

module.exports = { setIo, getIo, emitToBusiness };
