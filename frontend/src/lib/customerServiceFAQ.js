/**
 * Shared FAQ used by /track and /help (Customer Service).
 * Lift here so the two surfaces stay in sync without duplication.
 */
export const CUSTOMER_SERVICE_FAQ = [
  {
    q: "What is a tracking number and where do I find it?",
    a: "A tracking number is the unique reference your shipper issues for a package or freight booking. For parcels it usually starts with a service prefix and arrives by email or appears on your shipping label. For freight references like AWB, HBL, MBL or a container number, look on the booking confirmation, the bill of lading, or the air waybill PDF.",
  },
  {
    q: "When will tracking information appear?",
    a: "Tracking events start once the shipment is picked up and scanned into the network. Allow up to a few hours after pickup for the first event to show. International movements may take longer at customs gateways.",
  },
  {
    q: "Why is my tracking number not working?",
    a: "Double-check the number for typos and stray spaces. If it was issued in the past hour the network may not have indexed it yet. If it is several months old it may have been archived. For freight references, make sure you are using the correct format (AWB, HBL, container, or booking).",
  },
  {
    q: "What if I do not have a tracking number?",
    a: "Sign in to myDHLi to see every booking made under your account, including drafts and shipments handed to DHL Global Forwarding. If you cannot sign in, contact your sales representative or the local Customer Service desk and they can look up the reference for you.",
  },
];
