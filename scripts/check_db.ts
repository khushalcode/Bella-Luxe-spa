import { db } from '../src/lib/db'
async function main() {
  const members = await db.member.count()
  const memberships = await db.membership.count()
  const payments = await db.payment.count()
  const appointments = await db.appointment.count()
  const plans = await db.membershipPlan.count()
  const services = await db.service.count()
  const staff = await db.staff.count()
  const packages = await db.packageOffer.count()
  const campaigns = await db.campaign.count()
  console.log(JSON.stringify({ members, memberships, payments, appointments, plans, services, staff, packages, campaigns }, null, 2))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
