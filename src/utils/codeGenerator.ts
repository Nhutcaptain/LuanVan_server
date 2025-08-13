import { VaccinationAppointment } from "../models/appointment.model";

export const generate6DigitCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  do {
    code = Math.floor(100000 + Math.random() * 900000).toString(); // sinh số từ 100000 → 999999
    const existing = await VaccinationAppointment.findOne({ appointmentCode: code });
    exists = !!existing;
  } while (exists);

  return code;
};