/**
 * Voice Guard Cloud Inspection API Endpoint (Optional / Disabled by Default)
 * 
 * Note: Voice Guard runs 100% client-side in the browser by default.
 * No document image or bytes are transmitted to any server during standard operation.
 */
export default async function handler(req: any, res: any) {
  return res.status(200).json({
    status: 'client_side_only',
    message: 'Voice Guard executes 100% in-browser client-side forensics using WebGL and Canvas APIs. No remote cloud uploads are enabled or required.'
  });
}
