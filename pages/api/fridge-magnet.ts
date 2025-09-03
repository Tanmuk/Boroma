import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const phone = (process.env.NEXT_PUBLIC_PRIMARY_PHONE || '+1-555-0100').replace(/&/g,'&amp;')
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="600">
  <rect width="100%" height="100%" rx="36" fill="#fff3e8" stroke="#ffbe99" stroke-width="8"/>
  <text x="70" y="160" font-family="Mona Sans, Inter, Arial" font-size="64" font-weight="800" fill="#FF5B04">BOROMA</text>
  <text x="70" y="260" font-family="Inter, Arial" font-size="42" fill="#444">Your support number</text>
  <text x="70" y="380" font-family="Mona Sans, Inter, Arial" font-size="120" font-weight="800" fill="#FF5B04">${phone}</text>
  <text x="70" y="470" font-family="Inter, Arial" font-size="36" fill="#444">Patient tech help for seniors</text>
</svg>`
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Content-Disposition', 'attachment; filename="boroma-fridge-magnet.svg"')
  res.status(200).send(svg)
}
