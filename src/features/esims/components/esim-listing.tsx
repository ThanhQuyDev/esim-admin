import { EsimsTable } from './esims-table/index';

/**
 * The rows come from the browser, one request (vande-0411 #054). The server used
 * to fetch them first too, which held the page's HTML.
 */
export default function EsimListingPage() {
  return <EsimsTable />;
}
