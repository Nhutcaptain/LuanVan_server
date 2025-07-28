import { Server } from "socket.io";
import { isToday } from "date-fns";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*", // hoặc cụ thể frontend URL
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room ${room}`);
    });
    console.log("🟢 New client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("🔴 Client disconnected:", socket.id);
      console.log("Disconnect reason: ", reason);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const notifyExaminationUpdate = (examinationId: string, data: any) => {
  const io = getIO();
  io.to(`examination_${examinationId}`).emit("examination-update", {
    examinationId,
    data,
  });
};

export const handleTestOrderUpdate = (
  doctorId: string,
  patientId: string,
  testOrders: any
) => {
  const room = `doctor-${doctorId}`;
  io.to(room).emit("test-order-updated", {
    testOrders,
    patientId,
  });
};

export const emitCompleteStatus = (doctorId: string, appointmentId: string) => {
  const room = `doctor-${doctorId}`;
  io.to(room).emit("appointment-status-completed", appointmentId)
}

export const emitCompleteStatusForPatient = (patientId: string, appointmentId: string) => {
  const room = `patient-${patientId}`;
  io.to(room).emit("appointment-status-completed", appointmentId)
}

const isSameDate = (date1: Date, date2: Date) => {
  return (
    date1.toISOString().split("T")[0] === date2.toISOString().split("T")[0]
  );
};

export const emitNewAppointment = (appointment: any) => {
  const appointmentDate = new Date(appointment.appointmentDate);
  const today = new Date();

  // Chỉ phát socket nếu appointment là trong ngày hôm nay
  if (!isSameDate(appointmentDate, today)) {
    console.log("Không chung ngày");
    return;
  }
  const room = `doctor-${appointment.doctorId}`;
    console.log(`Emitting new-appointment to room ${room}`);
  io.to(room).emit("new-appointment", {
    appointmentDate: appointment.appointmentDate,
    session: appointment.session,
    queueNumber: appointment.queueNumber,
    patientId: appointment.patientId,
    status: appointment.status,
    _id: appointment._id,
  });
};

export const emitCancelAppointment = (appointment: any) => {
  const appointmentDate = new Date(appointment.appointmentDate);
  const now = new Date();


  if (!isSameDate(appointmentDate, now)) {
    console.log("Không chung ngày");
    return;
  }

  const room = `doctor-${appointment.doctorId}`;
  io.to(room).emit("cancel-appointment", {
    isCancel: true,
  });
};
