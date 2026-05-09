export default function handler(request, response) {
  if (request.url.includes('health')) {
    return response.status(200).json({ status: 'ok', message: 'Standard Vercel Function is ALIVE!' });
  }
  
  // Placeholder for real logic
  response.status(200).json({ message: "Ready to process quiz" });
}
