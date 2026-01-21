import { Request, Response, NextFunction } from 'express';
import * as service from './service';
import {
  createAlumniSchema,
  updateAlumniSchema,
  alumniQuerySchema,
  convertFromStudentSchema,
  createCareerSchema,
  updateCareerSchema,
  createEducationSchema,
  updateEducationSchema,
  createDonationSchema,
  updateDonationSchema,
  donationQuerySchema,
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
  registerEventSchema,
  updateAttendeeStatusSchema,
} from './schema';

// ==================== ALUMNI ====================

export async function getAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const query = alumniQuerySchema.parse(req.query);
    const result = await service.getAlumni(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAlumniById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const alumni = await service.getAlumniById(id);
    if (!alumni) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Alumni not found' } });
    }
    res.json({ success: true, data: alumni });
  } catch (error) {
    next(error);
  }
}

export async function createAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAlumniSchema.parse(req.body);
    const alumni = await service.createAlumni(data);
    res.status(201).json({ success: true, data: alumni });
  } catch (error) {
    next(error);
  }
}

export async function updateAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateAlumniSchema.parse(req.body);
    const alumni = await service.updateAlumni(id, data);
    res.json({ success: true, data: alumni });
  } catch (error) {
    next(error);
  }
}

export async function deleteAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteAlumni(id);
    res.json({ success: true, message: 'Alumni deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function convertFromStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;
    const data = convertFromStudentSchema.parse(req.body);
    const alumni = await service.convertFromStudent(studentId, data);
    res.status(201).json({ success: true, data: alumni });
  } catch (error) {
    next(error);
  }
}

export async function getAlumniStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getAlumniStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getTracerStudyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getTracerStudyStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// ==================== CAREER ====================

export async function getCareersByAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const { alumniId } = req.params;
    const careers = await service.getCareersByAlumni(alumniId);
    res.json({ success: true, data: careers });
  } catch (error) {
    next(error);
  }
}

export async function createCareer(req: Request, res: Response, next: NextFunction) {
  try {
    const { alumniId } = req.params;
    const data = createCareerSchema.parse(req.body);
    const career = await service.createCareer(alumniId, data);
    res.status(201).json({ success: true, data: career });
  } catch (error) {
    next(error);
  }
}

export async function updateCareer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateCareerSchema.parse(req.body);
    const career = await service.updateCareer(id, data);
    res.json({ success: true, data: career });
  } catch (error) {
    next(error);
  }
}

export async function deleteCareer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteCareer(id);
    res.json({ success: true, message: 'Career deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==================== EDUCATION ====================

export async function getEducationsByAlumni(req: Request, res: Response, next: NextFunction) {
  try {
    const { alumniId } = req.params;
    const educations = await service.getEducationsByAlumni(alumniId);
    res.json({ success: true, data: educations });
  } catch (error) {
    next(error);
  }
}

export async function createEducation(req: Request, res: Response, next: NextFunction) {
  try {
    const { alumniId } = req.params;
    const data = createEducationSchema.parse(req.body);
    const education = await service.createEducation(alumniId, data);
    res.status(201).json({ success: true, data: education });
  } catch (error) {
    next(error);
  }
}

export async function updateEducation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateEducationSchema.parse(req.body);
    const education = await service.updateEducation(id, data);
    res.json({ success: true, data: education });
  } catch (error) {
    next(error);
  }
}

export async function deleteEducation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteEducation(id);
    res.json({ success: true, message: 'Education deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==================== DONATIONS ====================

export async function getDonations(req: Request, res: Response, next: NextFunction) {
  try {
    const query = donationQuerySchema.parse(req.query);
    const result = await service.getDonations(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createDonation(req: Request, res: Response, next: NextFunction) {
  try {
    const { alumniId } = req.params;
    const data = createDonationSchema.parse(req.body);
    const donation = await service.createDonation(alumniId, data);
    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    next(error);
  }
}

export async function updateDonation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateDonationSchema.parse(req.body);
    const donation = await service.updateDonation(id, data);
    res.json({ success: true, data: donation });
  } catch (error) {
    next(error);
  }
}

export async function deleteDonation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteDonation(id);
    res.json({ success: true, message: 'Donation deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==================== EVENTS ====================

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = eventQuerySchema.parse(req.query);
    const result = await service.getEvents(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const event = await service.getEventById(id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEventSchema.parse(req.body);
    const event = await service.createEvent(data);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateEventSchema.parse(req.body);
    const event = await service.updateEvent(id, data);
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteEvent(id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==================== EVENT ATTENDEES ====================

export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventId } = req.params;
    const data = registerEventSchema.parse(req.body);
    const attendee = await service.registerForEvent(eventId, data);
    res.status(201).json({ success: true, data: attendee });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendeeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateAttendeeStatusSchema.parse(req.body);
    const attendee = await service.updateAttendeeStatus(id, data);
    res.json({ success: true, data: attendee });
  } catch (error) {
    next(error);
  }
}

export async function cancelRegistration(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.cancelRegistration(id);
    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
}
