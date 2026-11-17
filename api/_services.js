// Checked on each org's own site on 2026-11-16 (Build to Give). No phone = dial 2-1-1.
const TWO_ONE_ONE = { name: '2-1-1 Texas', phone: '2-1-1', url: 'https://www.211texas.org' }
const VLS = { name: 'Volunteer Legal Services of Central Texas', phone: '(512) 476-5550', url: 'https://www.vlsoct.org/get-help/' }

export const SERVICES = {
  housing_eviction: { ...VLS, what: 'Free legal advice from volunteer lawyers on landlord and eviction problems.' },
  utility_shutoff: { name: 'City of Austin Utilities Customer Assistance Program', phone: '512-494-9400', url: 'https://coautilities.com/wps/wcm/connect/occ/coa/util/support/customer-assistance', what: 'Bill discounts and emergency help for Austin Energy and Austin Water customers who are behind.' },
  immigration: { name: 'American Gateways', phone: '(512) 478-0546 ext. 200', url: 'https://www.americangateways.org/get-help', what: 'No-cost or low-cost immigration legal help in Austin, by appointment.' },
  debt_collection: { ...VLS, what: 'Free legal advice from volunteer lawyers on consumer and debt problems.' },
  benefits: { ...TWO_ONE_ONE, what: 'Free help line for SNAP, Medicaid and other benefits questions.' },
  taxes_irs: { name: 'Foundation Communities free tax help', phone: '737-717-4000', url: 'https://foundcom.org/prosper-centers/austin-tax-help/', what: 'Free tax help in Austin for households under its income limits.' },
  court_legal: { ...VLS, what: 'Free legal advice on civil court matters (not criminal cases or tickets).' },
  medical_bills: { ...TWO_ONE_ONE, what: 'Free help line that connects you to medical bill and health coverage help in Travis County.' },
  school: { ...TWO_ONE_ONE, what: "Free help line. Your child's school can also connect you to an Austin ISD Family Resource Center." },
  other: { ...TWO_ONE_ONE, what: 'Free help line for food, housing, health and other local services.' },
}
