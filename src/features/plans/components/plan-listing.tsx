import { PlansTable } from './plans-table';

/**
 * The rows come from the browser, one request (vande-0411 #054). The server used
 * to fetch them and the option lists first too, which held the page's HTML.
 */
export default function PlanListingPage() {
  return <PlansTable />;
}
