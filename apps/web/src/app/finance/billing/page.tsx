import { redirect } from "next/navigation";

/**
 * /finance/billing was a second santri billing screen that overlapped
 * /finance and disagreed with it: /finance aggregates across units, while this
 * one required a unit to be selected and defaulted to none, so the same data
 * showed "Rp 4.750.000 outstanding" there and "Rp 0" here.
 *
 * Its content is now the Tunggakan tab of /finance. This redirect stays so
 * existing bookmarks, the breadcrumbs in older screenshots, and any deep link
 * still land somewhere correct rather than 404ing.
 */
export default function BillingRedirect() {
  redirect("/finance");
}
