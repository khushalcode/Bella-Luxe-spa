import { PrismaClient } from '@prisma/client'
import { computeStatus } from '../src/lib/status'

const prisma = new PrismaClient({
  datasourceUrl: `file:${process.cwd()}/prisma/dev.db`,
})

async function main() {
  console.log('🧹 Wiping existing data...')
  // Delete in dependency order
  await prisma.payment.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.staffAttendance.deleteMany()
  await prisma.dailyEntry.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.member.deleteMany()
  await prisma.membershipPlan.deleteMany()
  await prisma.service.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.packageOffer.deleteMany()
  await prisma.campaign.deleteMany()

  // ---------- PLANS ----------
  console.log('🌱 Seeding plans...')
  const plans = await Promise.all([
    prisma.membershipPlan.create({
      data: {
        name: 'Premium Glow',
        price: 25000,
        durationDays: 365,
        sessionsIncluded: 24,
        discountPct: 20,
        benefits: JSON.stringify([
          'Aromatherapy',
          'Facial Therapy',
          'Body Scrub',
          'Priority Booking',
        ]),
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Relax & Renew',
        price: 18000,
        durationDays: 365,
        sessionsIncluded: 18,
        discountPct: 15,
        benefits: JSON.stringify([
          'Deep Tissue Massage',
          'Swedish Massage',
          'Reflexology',
        ]),
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Body Balance',
        price: 15000,
        durationDays: 180,
        sessionsIncluded: 12,
        discountPct: 10,
        benefits: JSON.stringify([
          'Hot Stone Therapy',
          'Body Scrub',
          'Aromatherapy',
        ]),
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Self-Care Plus',
        price: 10000,
        durationDays: 180,
        sessionsIncluded: 8,
        discountPct: 8,
        benefits: JSON.stringify(['Facial Therapy', 'Manicure & Pedicure']),
        isActive: true,
      },
    }),
  ])

  // ---------- MEMBERS ----------
  console.log('👥 Seeding members...')
  const memberSeed = [
    {
      code: 'BLM-001',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@example.com',
      gender: 'Female',
      dob: '1991-04-12',
      address: 'Sector 8, Chandigarh',
      notes: 'Prefers aroma therapy. Allergic to strong citrus oils.',
    },
    {
      code: 'BLM-002',
      name: 'Neha Verma',
      phone: '+91 98111 22334',
      email: 'neha.verma@example.com',
      gender: 'Female',
      dob: '1988-09-23',
      address: 'Sector 15, Chandigarh',
      notes: 'Monthly deep tissue massage. Likes early morning slots.',
    },
    {
      code: 'BLM-003',
      name: 'Anjali Mehta',
      phone: '+91 99887 76655',
      email: 'anjali.mehta@example.com',
      gender: 'Female',
      dob: '1993-12-05',
      address: 'Panchkula',
      notes: 'Renewal due soon. Sent WhatsApp reminder.',
    },
    {
      code: 'BLM-004',
      name: 'Ritika Sood',
      phone: '+91 99001 23456',
      email: 'ritika.sood@example.com',
      gender: 'Female',
      dob: '1995-07-18',
      address: 'Sector 35, Chandigarh',
      notes: 'VIP member. Birthday in July — birthday offer to be sent.',
    },
    {
      code: 'BLM-005',
      name: 'Kavya Arora',
      phone: '+91 91234 56789',
      email: 'kavya.arora@example.com',
      gender: 'Female',
      dob: '1990-02-14',
      address: 'Mohali',
      notes: 'Membership expired. Win-back campaign in progress.',
    },
    {
      code: 'BLM-006',
      name: 'Simran Kaur',
      phone: '+91 98987 65432',
      email: 'simran.kaur@example.com',
      gender: 'Female',
      dob: '1992-11-30',
      address: 'Sector 22, Chandigarh',
      notes: '',
    },
    {
      code: 'BLM-007',
      name: 'Divya Nair',
      phone: '+91 90011 22334',
      email: 'divya.nair@example.com',
      gender: 'Female',
      dob: '1989-03-09',
      address: 'Sector 9, Chandigarh',
      notes: '',
    },
    {
      code: 'BLM-008',
      name: 'Ishita Bose',
      phone: '+91 99678 12345',
      email: 'ishita.bose@example.com',
      gender: 'Female',
      dob: '1994-06-21',
      address: 'Zirakpur',
      notes: '',
    },
    {
      code: 'BLM-009',
      name: 'Manpreet Kaur',
      phone: '+91 90123 45678',
      email: 'manpreet.k@example.com',
      gender: 'Female',
      dob: '1991-08-17',
      address: 'Sector 44, Chandigarh',
      notes: '',
    },
    {
      code: 'BLM-010',
      name: 'Tanya Malhotra',
      phone: '+91 99887 11223',
      email: 'tanya.m@example.com',
      gender: 'Female',
      dob: '1996-01-25',
      address: 'Panchkula',
      notes: '',
    },
    {
      code: 'BLM-011',
      name: 'Riya Kapoor',
      phone: '+91 98234 56789',
      email: 'riya.kapoor@example.com',
      gender: 'Female',
      dob: '1993-10-11',
      address: 'Sector 20, Chandigarh',
      notes: '',
    },
    {
      code: 'BLM-012',
      name: 'Pooja Reddy',
      phone: '+91 91234 99887',
      email: 'pooja.reddy@example.com',
      gender: 'Female',
      dob: '1987-12-02',
      address: 'Mohali',
      notes: '',
    },
  ]

  const members = await Promise.all(
    memberSeed.map((m) =>
      prisma.member.create({
        data: {
          memberCode: m.code,
          name: m.name,
          phone: m.phone,
          email: m.email,
          gender: m.gender,
          dob: m.dob,
          address: m.address,
          notes: m.notes,
        },
      })
    )
  )

  // ---------- MEMBERSHIPS ----------
  // 8 Active (end > today+30), 3 Expiring Soon (today<=end<=today+30),
  // 1 Expired (end < today)
  console.log('📝 Seeding memberships...')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const DAY = 1000 * 60 * 60 * 24
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  // Plan assignment per member (matches v1 sample data)
  const planAssignment: { memberIdx: number; planIdx: number; startOffsetDays: number; durationOverrideDays?: number }[] = [
    // 8 Active memberships (end > today+30)
    { memberIdx: 0, planIdx: 0, startOffsetDays: -53 },   // Priya — Premium Glow, ~1y ago (Active)
    { memberIdx: 1, planIdx: 1, startOffsetDays: -31 },    // Neha — Relax & Renew (Active)
    { memberIdx: 3, planIdx: 0, startOffsetDays: -78 },    // Ritika — Premium Glow (Active)
    { memberIdx: 5, planIdx: 1, startOffsetDays: -12 },    // Simran — Relax & Renew (Active)
    { memberIdx: 6, planIdx: 2, startOffsetDays: -120 },   // Divya — Body Balance (Active)
    { memberIdx: 7, planIdx: 0, startOffsetDays: -30 },    // Ishita — Premium Glow (Active)
    { memberIdx: 10, planIdx: 0, startOffsetDays: -23 },   // Riya K — Premium Glow (Active)
    { memberIdx: 11, planIdx: 2, startOffsetDays: -100 }, // Pooja — Body Balance (Active)
    // 3 Expiring Soon (today <= end <= today+30)
    { memberIdx: 2, planIdx: 2, startOffsetDays: -160, durationOverrideDays: 180 }, // Anjali (180d plan, ends in ~20d)
    { memberIdx: 8, planIdx: 3, startOffsetDays: -160, durationOverrideDays: 180 }, // Manpreet (Self-Care Plus, expiring)
    { memberIdx: 9, planIdx: 1, startOffsetDays: -340, durationOverrideDays: 365 },  // Tanya — Relax & Renew expiring soon? Make it 360-day end
    // 1 Expired
    { memberIdx: 4, planIdx: 3, startOffsetDays: -240, durationOverrideDays: 180 }, // Kavya — Self-Care Plus, expired
  ]

  const memberships: Awaited<ReturnType<typeof prisma.membership.create>>[] = []
  for (const a of planAssignment) {
    const member = members[a.memberIdx]
    const plan = plans[a.planIdx]
    const start = new Date(today.getTime() + a.startOffsetDays * DAY)
    const durationDays = a.durationOverrideDays ?? plan.durationDays
    const end = new Date(start.getTime() + durationDays * DAY)
    const status = computeStatus(iso(end))
    const m = await prisma.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate: iso(start),
        endDate: iso(end),
        status,
        amountPaid: plan.price,
        autoRenew: false,
      },
    })
    memberships.push(m)
  }

  // ---------- SERVICES ----------
  console.log('💆 Seeding services...')
  const services = await Promise.all(
    [
      { name: 'Aromatherapy Massage', category: 'Massage', durationMin: 60, price: 2500, isActive: true },
      { name: 'Body Scrub Therapy', category: 'Body', durationMin: 45, price: 2200, isActive: true },
      { name: 'Deep Tissue Massage', category: 'Massage', durationMin: 75, price: 3000, isActive: true },
      { name: 'Swedish Massage', category: 'Massage', durationMin: 60, price: 2400, isActive: true },
      { name: 'Facial Therapy', category: 'Facial', durationMin: 60, price: 2800, isActive: true },
      { name: 'Hot Stone Therapy', category: 'Massage', durationMin: 90, price: 3500, isActive: true },
      { name: 'Reflexology', category: 'Massage', durationMin: 45, price: 1800, isActive: true },
      { name: 'Anti-Aging Facial', category: 'Facial', durationMin: 75, price: 4200, isActive: true },
      { name: 'Hair Spa', category: 'Hair', durationMin: 60, price: 2000, isActive: false },
      { name: 'Manicure & Pedicure', category: 'Nails', durationMin: 75, price: 1900, isActive: true },
    ].map((s) => prisma.service.create({ data: s }))
  )

  // ---------- STAFF ----------
  console.log('👩‍⚕️ Seeding staff...')
  const staffSeed = [
    { name: 'Aarti Kapoor', role: 'Senior Therapist', specialization: 'Aromatherapy', commissionPct: 15, perDaySalary: 1200, workingHours: JSON.stringify({ start: '09:00', end: '18:00' }) },
    { name: 'Riya Malhotra', role: 'Therapist', specialization: 'Deep Tissue', commissionPct: 12, perDaySalary: 1000, workingHours: JSON.stringify({ start: '10:00', end: '19:00' }) },
    { name: 'Pooja Singh', role: 'Receptionist', specialization: 'Front Desk', commissionPct: 0, perDaySalary: 700, workingHours: JSON.stringify({ start: '09:00', end: '17:00' }) },
    { name: 'Meera Nair', role: 'Manager', specialization: 'Operations', commissionPct: 5, perDaySalary: 1500, workingHours: JSON.stringify({ start: '10:00', end: '20:00' }) },
    { name: 'Sneha Reddy', role: 'Therapist', specialization: 'Facial Therapy', commissionPct: 12, perDaySalary: 1000, workingHours: JSON.stringify({ start: '11:00', end: '20:00' }) },
    { name: 'Kavya Iyer', role: 'Therapist', specialization: 'Body Scrub', commissionPct: 12, perDaySalary: 950, workingHours: JSON.stringify({ start: '09:30', end: '18:30' }) },
  ]
  const staff = await Promise.all(
    staffSeed.map((s) => prisma.staff.create({ data: { ...s, isActive: true } }))
  )

  // ---------- APPOINTMENTS (5 today) ----------
  console.log('📅 Seeding appointments...')
  const todayStr = today.toISOString().slice(0, 10)
  const aptTimes = ['10:00', '11:30', '13:00', '15:00', '17:00']
  const aptData = [
    { memberIdx: 0, serviceIdx: 0, staffIdx: 0 }, // Priya — Aromatherapy — Aarti
    { memberIdx: 1, serviceIdx: 1, staffIdx: 5 },  // Neha — Body Scrub — Kavya Iyer
    { memberIdx: 2, serviceIdx: 2, staffIdx: 1 },  // Anjali — Deep Tissue — Riya Malhotra
    { memberIdx: 3, serviceIdx: 3, staffIdx: 0 },  // Ritika — Swedish — Aarti
    { memberIdx: 4, serviceIdx: 4, staffIdx: 4 },  // Kavya — Facial — Sneha
  ]
  for (let i = 0; i < aptData.length; i++) {
    const a = aptData[i]
    const t = aptTimes[i]
    const [hh, mm] = t.split(':').map((x) => parseInt(x, 10))
    const start = new Date(today)
    start.setHours(hh, mm, 0, 0)
    const end = new Date(start.getTime() + services[a.serviceIdx].durationMin * 60 * 1000)
    await prisma.appointment.create({
      data: {
        memberId: members[a.memberIdx].id,
        serviceId: services[a.serviceIdx].id,
        staffId: staff[a.staffIdx].id,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        status: 'Booked',
        notes: '',
      },
    })
    void todayStr
  }

  // ---------- PAYMENTS (10) ----------
  console.log('💳 Seeding payments...')
  const methods = ['UPI', 'Card', 'Cash', 'UPI', 'Card', 'UPI', 'Cash', 'UPI', 'Card', 'UPI']
  for (let i = 0; i < 10; i++) {
    const m = memberships[i % memberships.length]
    const member = members[i % members.length]
    const plan = plans.find((p) => p.id === m.planId)!
    await prisma.payment.create({
      data: {
        memberId: member.id,
        membershipId: m.id,
        amount: plan.price,
        method: methods[i],
        status: i === 4 ? 'Refunded' : 'Paid',
        invoiceNo: `INV-2026-${String(1001 + i).padStart(4, '0')}`,
        paidAt: new Date(today.getTime() - i * 6 * DAY),
      },
    })
  }

  // ---------- PACKAGES (5) ----------
  console.log('🎁 Seeding packages...')
  await Promise.all(
    [
      { title: 'Diwali Glow', type: 'Festive Offer', discountValue: 25, discountType: 'percent', validFrom: '2026-10-01', validTo: '2026-11-15', code: 'DIWALI25', isActive: true },
      { title: 'Couple Spa Bundle', type: 'Bundle', discountValue: 20, discountType: 'percent', validFrom: '2026-09-01', validTo: '2026-12-31', code: 'COUPLE20', isActive: true },
      { title: 'New Member Welcome', type: 'Coupon', discountValue: 500, discountType: 'amount', validFrom: '2026-01-01', validTo: '2026-12-31', code: 'WELCOME500', isActive: true },
      { title: 'Birthday Month Special', type: 'Coupon', discountValue: 15, discountType: 'percent', validFrom: '2026-01-01', validTo: '2026-12-31', code: 'BIRTHDAY15', isActive: false },
      { title: 'Summer Refresh', type: 'Festive Offer', discountValue: 10, discountType: 'percent', validFrom: '2026-05-01', validTo: '2026-07-31', code: 'SUMMER10', isActive: true },
    ].map((p) => prisma.packageOffer.create({ data: p }))
  )

  // ---------- CAMPAIGNS (3) ----------
  console.log('📣 Seeding campaigns...')
  await Promise.all(
    [
      { name: 'Diwali Renewal Push', channel: 'WhatsApp', template: 'Diwali special: Renew now & get 25% off your next session ✨', segment: JSON.stringify(['Expiring Soon', 'Active']), scheduledAt: new Date(today.getTime() + 3 * DAY).toISOString(), status: 'Scheduled' },
      { name: 'Birthday Wishes', channel: 'SMS', template: 'Happy Birthday from Bella Luxe! Enjoy 15% off any service this month 🌸', segment: JSON.stringify(['Birthday This Month']), scheduledAt: null, status: 'Draft' },
      { name: 'Win-Back Expired', channel: 'Email', template: 'We miss you at Bella Luxe. Reactivate & get ₹500 off.', segment: JSON.stringify(['Expired']), scheduledAt: null, status: 'Draft' },
    ].map((c) => prisma.campaign.create({ data: c }))
  )

  // ---------- DAILY ENTRIES (last 30 days, ~4-8 per day) ----------
  console.log('📋 Seeding daily entries...')
  const serviceNames = services.map((s) => s.name)
  const paymentModes = ['Cash', 'UPI', 'Card']
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today.getTime() - d * DAY)
    const dateStr = iso(date)
    // More entries on weekdays, fewer on weekends
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const numEntries = isWeekend ? 3 + (d % 3) : 4 + (d % 5)
    for (let i = 0; i < numEntries; i++) {
      const memberIdx = (d + i) % members.length
      const member = members[memberIdx]
      const serviceIdx = (d * 3 + i) % serviceNames.length
      const therapist = staff[serviceIdx % staff.length]
      const isWalkIn = i === 0 && d % 4 === 0
      await prisma.dailyEntry.create({
        data: {
          entryDate: dateStr,
          memberCode: isWalkIn ? null : member.memberCode,
          memberName: isWalkIn ? 'Walk-in Guest' : member.name,
          phone: isWalkIn ? null : member.phone,
          serviceName: serviceNames[serviceIdx],
          therapistName: therapist.name,
          amount: 1500 + ((d * 100 + i * 50) % 3000),
          paymentMode: paymentModes[(d + i) % 3],
          notes: isWalkIn ? 'Walk-in, no membership' : null,
        },
      })
    }
  }

  // ---------- STAFF ATTENDANCE (last 60 days) ----------
  console.log('🕒 Seeding staff attendance...')
  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Half-Day', 'Absent', 'Leave']
  for (let d = 59; d >= 0; d--) {
    const date = new Date(today.getTime() - d * DAY)
    const dateStr = iso(date)
    const isSunday = date.getDay() === 0
    for (let s = 0; s < staff.length; s++) {
      const st = staff[s]
      // Receptionist (idx 2) takes Sunday off, others alternate
      let status: string
      if (isSunday && s !== 3) {
        status = 'Holiday'
      } else {
        status = attendanceStatuses[(d + s) % attendanceStatuses.length]
      }
      const checkIn = status === 'Present' ? '09:30' : status === 'Half-Day' ? '09:30' : null
      const checkOut = status === 'Present' ? '18:00' : status === 'Half-Day' ? '14:00' : null
      await prisma.staffAttendance.create({
        data: {
          staffId: st.id,
          date: dateStr,
          status,
          checkIn,
          checkOut,
          notes: status === 'Leave' ? 'Personal work' : status === 'Absent' ? 'No intimation' : null,
        },
      })
    }
  }

  console.log('✅ Seed complete')
  console.log(`   Plans:        ${await prisma.membershipPlan.count()}`)
  console.log(`   Members:      ${await prisma.member.count()}`)
  console.log(`   Memberships:  ${await prisma.membership.count()}`)
  console.log(`   Services:     ${await prisma.service.count()}`)
  console.log(`   Staff:        ${await prisma.staff.count()}`)
  console.log(`   Appointments: ${await prisma.appointment.count()}`)
  console.log(`   Payments:     ${await prisma.payment.count()}`)
  console.log(`   Packages:     ${await prisma.packageOffer.count()}`)
  console.log(`   Campaigns:    ${await prisma.campaign.count()}`)
  console.log(`   Daily Entries:    ${await prisma.dailyEntry.count()}`)
  console.log(`   Staff Attendance: ${await prisma.staffAttendance.count()}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
