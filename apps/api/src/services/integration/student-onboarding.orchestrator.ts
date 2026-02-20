/**
 * Student Onboarding Orchestrator
 * Integrasi End-to-End: PPDB -> Akademik -> Finance -> Medical -> Mutu
 * 
 * Skenario: Saat Santri Baru menyelesaikan Pendaftaran (PPDB) dan dibayar Lunas / Dinyatakan Lulus,
 * orkestrator ini menghubungkan 5 domain berbeda secara efisien dan rapih tanpa tight-coupling.
 */

import { prisma } from '../../lib/prisma';
import { eventBus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { PaymentStatus } from '@prisma/client';

export interface OnboardingPayload {
  registrantId: string;
  unitId: string;
  assignedClassId?: string;
  academicYearId: string;
  parentUserId: string;
  actorId: string;
}

export class StudentOnboardingOrchestrator {
  
  /**
   * Mengeksekusi keseluruhan integrasi ketika siswa baru lulus PPDB.
   */
  static async executeOnboarding(payload: OnboardingPayload) {
    logger.info(`Memulai Onboarding Santri End-to-End untuk Registrant: ${payload.registrantId}`);

    return await prisma.$transaction(async (tx) => {
      // 1. Validasi Registrant (Domain: PPDB / Marketing)
      const registrant = await tx.registrant.findUnique({
        where: { id: payload.registrantId },
        include: { user: true }
      });

      if (!registrant) {
        throw new Error('Data Pendaftar tidak ditemukan.');
      }

      // 2. Pembuatan Master Data Siswa (Domain: Akademik Dasar)
      // Mentransfer user dari calon siswa menjadi Siswa aktif.
      const newStudent = await tx.student.create({
        data: {
          userId: registrant.userId,
          unitId: payload.unitId,
          nis: `NIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, // Generate NIS
          status: 'ACTIVE',
        }
      });

      // Hubungkan orang tua ke siswa
      await tx.studentParent.create({
        data: {
          studentId: newStudent.id,
          userId: payload.parentUserId,
          relationship: 'FATHER', // Asumsi default, dapat dimodifikasi
          isPrimary: true
        }
      });

      // 3. Pendaftaran Kelas (Domain: Kurikulum / Akademik)
      if (payload.assignedClassId) {
        await tx.classEnrollment.create({
          data: {
            studentId: newStudent.id,
            classId: payload.assignedClassId,
            status: 'ACTIVE'
          }
        });
        logger.info(`Siswa dialokasikan ke kelas: ${payload.assignedClassId}`);
      }

      // 4. Inisialisasi Rekam Medis Kosong (Domain: Kesehatan / UKS)
      // Memastikan setiap siswa punya template kesehatan untuk diisi dokter sekolah.
      const medicalRecord = await tx.medicalRecord.create({
        data: {
          studentId: newStudent.id,
          unitId: payload.unitId,
          bloodType: 'UNKNOWN',
          weight: 0,
          height: 0,
          history: 'Belum ada riwayat tercatat (Gen otomatis via Onboarding)',
          allergies: 'Belum dicek'
        }
      });

      // 5. Inisiasi Tagihan SPP Pertama (Domain: Finance)
      // Mencari tipe pembayaran SPP reguler untuk unit ini.
      const sppPaymentType = await tx.paymentType.findFirst({
        where: { unitId: payload.unitId, code: 'SPP', isActive: true }
      });

      let invoice = null;
      if (sppPaymentType) {
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber: `INV-SPP-${newStudent.nis}`,
            studentId: newStudent.id,
            paymentTypeId: sppPaymentType.id,
            amount: sppPaymentType.amount,
            status: PaymentStatus.PENDING,
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Jatuh tempo bulan deoan
            title: `SPP Bulan Pertama - ${registrant.user.name}`
          }
        });
      }

      // 6. Alokasi Asrama (Jika Boarding School) - Domain: Pesantren/Asrama
      // Implementasi dapat ditempatkan pada Event Subscriber terpisah agar tidak membebani transaksi.

      // 7. Emitasi Event Lintas Modul (Event-Bus)
      // Trigger Notifikasi dan Dashboard Update di luar transaksi kritis.
      process.nextTick(() => {
        eventBus.emit('student:created', {
          id: newStudent.id,
          name: registrant.user.name,
          unitId: payload.unitId,
          unitName: 'Sistem Onboarding Terpusat',
          classId: payload.assignedClassId,
        });

        eventBus.emit('health:medical-record-created', {
          id: medicalRecord.id,
          studentId: newStudent.id,
          studentName: registrant.user.name,
          unitId: payload.unitId,
          unitName: 'UKS',
          type: 'Pemeriksaan Awal Dasar',
          complaint: 'Skrining Awal',
          status: 'Dijadwalkan',
          recordedAt: new Date()
        });

        if (invoice) {
          eventBus.emit('notification:send', {
            userId: payload.parentUserId,
            type: 'FINANCE',
            title: 'Tagihan SPP Pertama Terbit',
            message: `Selamat, Ananda ${registrant.user.name} resmi terdaftar. Mohon lunasi tagihan bulan pertama.`
          });
        }
      });

      logger.info(`Onboarding E2E berhasil untuk: ${registrant.user.name}. Siswa ID: ${newStudent.id}`);

      return {
        success: true,
        studentId: newStudent.id,
        invoiceId: invoice?.id,
        medicalRecordId: medicalRecord.id
      };
    });
  }
}
